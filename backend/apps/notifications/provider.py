"""The only external email boundary. Never log provider bodies or credentials."""
import requests
from django.conf import settings


class PermanentEmailError(Exception):
    pass


class RetryableEmailError(Exception):
    def __init__(self, code, retry_after=0):
        super().__init__(code)
        self.retry_after = retry_after


def send_resend(payload, idempotency_key):
    if settings.EMAIL_DELIVERY_MODE != 'resend' or not settings.RESEND_API_KEY:
        raise PermanentEmailError('email_not_configured')
    try:
        response = requests.post('https://api.resend.com/emails', json=payload,
            headers={'Authorization': f'Bearer {settings.RESEND_API_KEY}',
                     'Idempotency-Key': idempotency_key, 'Content-Type': 'application/json'},
            timeout=(3, 12), allow_redirects=False)
    except requests.RequestException:
        raise RetryableEmailError('provider_connection_error') from None
    if response.status_code == 429 or response.status_code >= 500 or response.status_code == 409:
        try:
            delay = min(3600, max(0, int(response.headers.get('Retry-After', 0))))
        except (ValueError, TypeError):
            delay = 0
        raise RetryableEmailError(f'provider_http_{response.status_code}', delay)
    if not 200 <= response.status_code < 300:
        raise PermanentEmailError(f'provider_http_{response.status_code}')
    try:
        body = response.json()
        if not isinstance(body, dict) or not isinstance(body.get('id'), str) or not body['id']:
            raise ValueError()
        return body['id']
    except ValueError:
        raise RetryableEmailError('provider_invalid_response') from None
# SIRI.DEV
