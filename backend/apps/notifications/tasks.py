from datetime import timedelta
from celery import shared_task
from cryptography.fernet import InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from .models import Notification
from .delivery import decode_payload, dispatch_notification
from .provider import send_resend, RetryableEmailError, PermanentEmailError


@shared_task(ignore_result=True)
def deliver_notification(notification_id):
    now = timezone.now()
    with transaction.atomic():
        record = Notification.objects.select_for_update().filter(pk=notification_id).first()
        if not record or record.state not in ('pending', 'sending'):
            return
        if record.state == 'sending' and record.lease_at and record.lease_at > now - timedelta(minutes=5):
            return
        if record.state == 'pending' and record.next_attempt_at and record.next_attempt_at > now:
            return
        if record.expires_at and record.expires_at <= now:
            record.state = 'expired'
        elif record.first_attempt_at and now >= record.first_attempt_at + timedelta(hours=24):
            record.state = 'review'
        elif settings.EMAIL_DELIVERY_MODE != 'resend':
            # A disabled worker leaves live queued mail for recovery after re-enabling.
            return
        else:
            record.state = 'sending'
            record.lease_at = now
            record.first_attempt_at = record.first_attempt_at or now
            record.attempts += 1
        record.save()
        if record.state != 'sending':
            return
        encrypted, attempt = record.payload, record.attempts
    try:
        payload = decode_payload(encrypted)
        provider_id = send_resend(payload, f'nameassist/{notification_id}')
    except RetryableEmailError as exc:
        delay = max(min(3600, 30 * 2 ** min(attempt - 1, 7)), exc.retry_after)
        updates = dict(state='pending' if attempt < 8 else 'review', last_error=str(exc)[:100],
                       next_attempt_at=timezone.now() + timedelta(seconds=delay))
    except (PermanentEmailError, ImproperlyConfigured, InvalidToken, ValueError):
        updates = dict(state='failed', last_error='email_delivery_configuration_error')
    else:
        updates = dict(state='sent', provider_message_id=provider_id, sent_at=timezone.now(), last_error='')
    # A stale worker cannot overwrite a newer recovery attempt's result.
    Notification.objects.filter(pk=notification_id, state='sending', lease_at=now).update(
        **updates, lease_at=None, updated_at=timezone.now())


@shared_task(ignore_result=True)
def recover_pending_notifications():
    if settings.EMAIL_DELIVERY_MODE != 'resend':
        return
    now = timezone.now()
    ids = Notification.objects.filter(
        Q(state='pending', next_attempt_at__lte=now) |
        Q(state='sending', lease_at__lte=now - timedelta(minutes=5))
    ).order_by('created_at').values_list('pk', flat=True)[:100]
    for notification_id in ids:
        dispatch_notification(notification_id)


@shared_task(ignore_result=True)
def send_status_notification(application_id, new_status, user_id=None):
    """Compatibility for already queued tasks; deduplicate against status history."""
    from apps.applications.models import Application
    from .services import notify_status_changed
    application = Application.objects.filter(pk=application_id).first()
    if application:
        history = application.status_history.filter(status=new_status).order_by('-created_at').first()
        if history:
            notify_status_changed(application, history)
# SIRI.DEV
