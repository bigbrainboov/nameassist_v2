"""Durable outbox. Provider failures never roll back business transactions."""
import base64
import hashlib
import json
import logging
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
from kombu.exceptions import OperationalError
from .models import Notification
from .rendering import render_email

logger = logging.getLogger(__name__)


def payload_cipher():
    key = settings.EMAIL_PAYLOAD_ENCRYPTION_KEY
    if len(key) < 32:
        raise ImproperlyConfigured('EMAIL_PAYLOAD_ENCRYPTION_KEY must contain at least 32 characters.')
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest()))


def decode_payload(value):
    return json.loads(payload_cipher().decrypt(value.encode()).decode())


def dispatch_notification(notification_id):
    from .tasks import deliver_notification
    try:
        deliver_notification.apply_async(args=[str(notification_id)], retry=False)
    except (OperationalError, OSError):
        logger.warning('Email dispatch unavailable; recovery will retry', extra={'notification_id': str(notification_id)})


def enqueue_email(*, kind, user, context, event_key, application=None, expires_at=None):
    # Existing event payloads never change, including their recipient and links.
    existing = Notification.objects.filter(event_key=event_key).first()
    if existing:
        return existing
    values = {'first_name': user.full_name.strip().split()[0] if user.full_name.strip() else 'there', **context}
    mode = settings.EMAIL_DELIVERY_MODE
    state, error, encrypted, subject = 'pending', '', '', ''
    try:
        if mode not in ('preview', 'resend'):
            raise ImproperlyConfigured('Invalid email mode')
        rendered = render_email(kind, values)
        subject = rendered['subject'][:255]
        payload = {'from': settings.DEFAULT_FROM_EMAIL, 'to': [user.email], **rendered}
        if settings.EMAIL_REPLY_TO:
            validate_email(settings.EMAIL_REPLY_TO)
            payload['reply_to'] = settings.EMAIL_REPLY_TO
        if mode == 'preview':
            # Preview records contain no security tokens and cannot later be sent.
            state = 'preview'
        else:
            from email.utils import parseaddr
            validate_email(parseaddr(settings.DEFAULT_FROM_EMAIL)[1])
            if not settings.RESEND_API_KEY:
                raise ImproperlyConfigured('Missing Resend key')
            encrypted = payload_cipher().encrypt(json.dumps(payload).encode()).decode()
    except (ImproperlyConfigured, ValueError, ValidationError):
        state, error = 'failed', 'email_configuration_error'
    with transaction.atomic():
        notification, created = Notification.objects.get_or_create(event_key=event_key, defaults={
            'user': user, 'application': application, 'type': kind, 'channel': 'email',
            'recipient': user.email, 'subject': subject, 'payload': encrypted, 'state': state,
            'last_error': error, 'expires_at': expires_at, 'next_attempt_at': timezone.now(),
        })
        if created and state == 'pending':
            transaction.on_commit(lambda: dispatch_notification(notification.pk))
    return notification
# SIRI.DEV
