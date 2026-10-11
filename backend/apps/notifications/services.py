"""Business events map to template data; no network calls occur here."""
from datetime import timedelta
from uuid import uuid4
from django.utils import timezone
from .delivery import enqueue_email

STAGES = {
    'received': ('Received', 'Your request has been received.'),
    'document_review': ('Document review', 'Our team is checking your submitted documents.'),
    'processing': ('Processing', 'Your application is being processed.'),
    'newspaper_publication': ('Newspaper publication', 'Your request is at the newspaper publication stage.'),
    'final_documentation': ('Final documentation', 'Your final documents are being prepared.'),
    'completed': ('Completed', 'Your request is complete.'),
}


def notify_signup(user):
    enqueue_email(kind='welcome', user=user, context={}, event_key=f'welcome/{user.pk}')
    if not user.email_verified:
        notify_verification(user, event_key=f'verification/signup/{user.pk}')


def notify_verification(user, event_key=None):
    from apps.accounts.email_tokens import make_verification_token
    return enqueue_email(kind='verification', user=user,
        context={'token': make_verification_token(user)},
        event_key=event_key or f'verification/{uuid4()}', expires_at=timezone.now() + timedelta(hours=24))


def notify_password_reset(user):
    from apps.accounts.email_tokens import make_password_reset_token
    return enqueue_email(kind='password_reset', user=user,
        context={'token': make_password_reset_token(user)},
        event_key=f'password-reset/{uuid4()}', expires_at=timezone.now() + timedelta(hours=1))


def application_context(application):
    return {'service': application.service.name, 'reference': application.reference_no}


def notify_application_received(application):
    from apps.payments.services import confirmed_payments
    return enqueue_email(kind='request_received', user=application.user, application=application,
        context={**application_context(application), 'awaiting_payment': not confirmed_payments(application).exists()},
        event_key=f'application/{application.pk}')


def notify_payment_confirmed(payment):
    if payment.status != 'success' or not payment.verified_at:
        return None
    return enqueue_email(kind='payment_confirmation', user=payment.user, application=payment.application,
        context={**application_context(payment.application), 'amount': f'{payment.amount:,.2f}',
            'currency': payment.currency, 'payment_reference': payment.gateway_reference,
            'date': payment.verified_at.strftime('%d %B %Y, %H:%M UTC')}, event_key=f'payment/{payment.pk}')


def notify_status_changed(application, history):
    kind = 'request_completed' if history.status == 'completed' else 'status_update'
    label, description = STAGES.get(history.status, ('Updated', 'Check your dashboard for the latest progress.'))
    return enqueue_email(kind=kind, user=application.user, application=application,
        context={**application_context(application), 'status': label, 'description': description},
        event_key=f'status/{history.pk}')
# SIRI.DEV
