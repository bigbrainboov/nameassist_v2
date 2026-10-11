"""Render repository-owned transactional emails; all customer text is escaped."""
from urllib.parse import urlencode, urlsplit
from django.conf import settings
from django.template.loader import render_to_string

COPY = {
    'welcome': ('Welcome to NameAssist', 'Your next chapter starts here.',
        'A simpler way to manage your name and documentation journey. We are here to help you every step of the way.', 'Open your dashboard', '/dashboard'),
    'verification': ('Verify your email address', 'One small step to secure your account.',
        'Confirm this email address belongs to you. This link expires in 24 hours. If you did not create this account, you can ignore this email.', 'Verify email', None),
    'request_received': ('We have received your request', 'Your documentation journey is underway.',
        'Your request has been saved. You can follow its progress and manage your documents from your dashboard.', 'View request', '/dashboard/applications'),
    'payment_confirmation': ('Payment confirmed', 'Thank you. Your payment has been confirmed.',
        'We have successfully verified your payment. Keep the details below for your records.', 'View payment', '/dashboard/payments'),
    'status_update': ('An update on your request', 'Your request has moved to the next stage.',
        'Here is the latest progress on your documentation request.', 'Track request', '/dashboard/applications'),
    'request_completed': ('Your request is complete', 'Your next chapter is ready.',
        'Your service is complete. Sign in to view your completed documents securely.', 'View your documents', '/dashboard/documents'),
    'password_reset': ('Reset your NameAssist password', 'A secure link to get you back into your account.',
        'Use the button below to choose a new password. This link expires in one hour and becomes invalid after a successful reset. If you did not request this, you can ignore this email.', 'Reset password', None),
    'general': ('A message from NameAssist', 'An update for you.', '', 'View details', None),
}


def frontend_url(route, params=None):
    base = settings.FRONTEND_URL.rstrip('/')
    parsed = urlsplit(base)
    if (not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment
            or parsed.path not in ('', '/') or (parsed.scheme != 'https' and not
            (parsed.scheme == 'http' and parsed.hostname in ('localhost', '127.0.0.1')))):
        raise ValueError('FRONTEND_URL must be a trusted website origin.')
    if not route.startswith('/') or route.startswith('//') or '?' in route or '#' in route:
        raise ValueError('Invalid frontend route.')
    return base + '/#' + route + ('?' + urlencode(params) if params else '')


def render_email(kind, context):
    if kind not in COPY:
        raise ValueError('Unknown email template.')
    subject, preheader, message, button, route = COPY[kind]
    values = dict(context)
    if kind in ('verification', 'password_reset') and values.get('token'):
        security_route = '/verify-email' if kind == 'verification' else '/reset-password'
        values['action_url'] = frontend_url(security_route, {'token': values.pop('token')})
    action = values.get('action_url') or (frontend_url(route) if route else '')
    if action:
        parsed, origin = urlsplit(action), urlsplit(frontend_url('/'))
        if (parsed.scheme, parsed.netloc) != (origin.scheme, origin.netloc) or parsed.username or parsed.password:
            raise ValueError('Email actions must link to the configured website.')
    if kind in ('verification', 'password_reset') and not action:
        raise ValueError('Security email requires an action link.')
    title = str(values.get('title') or subject) if kind == 'general' else subject
    if '\r' in title or '\n' in title:
        raise ValueError('Email title must be a single line.')
    values.update(subject=title, heading=title, preheader=preheader,
        message=values.get('message', '') if kind == 'general' else message,
        first_name=values.get('first_name') or 'there', action_url=action, button=button,
        logo_url=settings.EMAIL_LOGO_URL or settings.FRONTEND_URL.rstrip('/') + '/assets/nameassist-logo.png',
        support_url=frontend_url('/dashboard/support'), security=kind in ('verification', 'password_reset'))
    return {'subject': title, 'html': render_to_string(f'notifications/{kind}.html', values),
            'text': render_to_string('notifications/message.txt', values).strip()}
# SIRI.DEV
