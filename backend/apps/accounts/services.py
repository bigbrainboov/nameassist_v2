from datetime import timedelta
import base64
import hashlib

import pyotp
from cryptography.fernet import Fernet, InvalidToken as InvalidSecret
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import salted_hmac
from rest_framework.exceptions import AuthenticationFailed, Throttled
from rest_framework.permissions import BasePermission
from rest_framework.throttling import BaseThrottle
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AuthSession, LoginLimit, User


def mfa_cipher():
    key = settings.MFA_ENCRYPTION_KEY
    if len(key) < 32:
        raise ImproperlyConfigured('MFA_ENCRYPTION_KEY must be configured for admin MFA.')
    # Render generates a high-entropy string. Derive the fixed-size encryption
    # key without requiring a particular environment-variable encoding.
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest()))


def verify_admin_otp(user, otp):
    """Consume an authenticator code once, including concurrent login attempts."""
    if not user.admin_mfa_secret or not otp or len(otp) != 6 or not otp.isascii() or not otp.isdigit():
        return False
    try:
        totp = pyotp.TOTP(mfa_cipher().decrypt(user.admin_mfa_secret.encode()).decode())
    except (InvalidSecret, ImproperlyConfigured, ValueError):
        return False
    current_step = int(timezone.now().timestamp()) // 30
    for step in (current_step, current_step - 1, current_step + 1):
        if pyotp.utils.strings_equal(totp.at(step * 30), otp):
            # Conditional update is atomic on both PostgreSQL and SQLite.
            return bool(User.objects.filter(pk=user.pk, admin_mfa_last_step__lt=step).update(
                admin_mfa_last_step=step,
            ))
    return False


def create_session_tokens(user, scope='customer'):
    if not user.is_active or (scope == 'admin' and user.role != 'admin'):
        raise AuthenticationFailed('This account does not have access.')
    lifetime = timedelta(hours=8) if scope == 'admin' else timedelta(days=7)
    session = AuthSession.objects.create(
        user=user, scope=scope, version=user.session_version,
        expires_at=timezone.now() + lifetime,
    )
    refresh = RefreshToken.for_user(user)
    refresh['sid'] = str(session.id)
    refresh.set_exp(lifetime=lifetime)
    access = refresh.access_token
    if scope == 'admin':
        access.set_exp(lifetime=timedelta(minutes=5))
    return {'access': str(access), 'refresh': str(refresh)}


def valid_session(token):
    try:
        session = AuthSession.objects.select_related('user').get(
            pk=token.get('sid'), user_id=token.get('user_id'), revoked=False,
            expires_at__gt=timezone.now(),
        )
    except (AuthSession.DoesNotExist, ValueError, TypeError, ValidationError):
        raise AuthenticationFailed('Session expired. Please log in again.')
    user = session.user
    if not user.is_active or session.version != user.session_version or (
        session.scope == 'admin' and (user.role != 'admin' or not user.admin_mfa_secret)
    ):
        raise AuthenticationFailed('Session expired. Please log in again.')
    return session


class SessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        return valid_session(validated_token).user


class IsAdminSession(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_active or request.user.role != 'admin':
            return False
        return bool(request.auth and valid_session(request.auth).scope == 'admin')


class LoginThrottle(BaseThrottle):
    """Shared, database-backed limits; counters cannot be bypassed by switching login routes."""
    def allow_request(self, request, view):
        payload = request.data if isinstance(request.data, dict) else {}
        email = str(payload.get('email', '')).strip().lower()
        identities = [('email:' + email, settings.LOGIN_ACCOUNT_LIMIT)]
        # Do not trust client-supplied forwarding headers for security decisions.
        identities.append(('peer:' + request.META.get('REMOTE_ADDR', ''), settings.LOGIN_IP_LIMIT))
        now = timezone.now()
        for identity, limit in identities:
            key = salted_hmac('login-limit', identity, algorithm='sha256').hexdigest()
            with transaction.atomic():
                LoginLimit.objects.get_or_create(key=key, defaults={'expires_at': now})
                bucket = LoginLimit.objects.select_for_update().get(pk=key)
                if bucket.expires_at <= now:
                    bucket.attempts = 0
                    bucket.expires_at = now + timedelta(seconds=settings.LOGIN_WINDOW_SECONDS)
                if bucket.attempts >= limit:
                    raise Throttled(wait=max(1, int((bucket.expires_at - now).total_seconds())))
                bucket.attempts += 1
                bucket.save()
        return True
# SIRI.DEV
