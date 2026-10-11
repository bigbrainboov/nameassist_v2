from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import salted_hmac
from rest_framework.exceptions import Throttled
from rest_framework.throttling import BaseThrottle
from .models import LoginLimit


class EmailActionThrottle(BaseThrottle):
    """Shared database counters: three requests per address and 30 per peer per 15 minutes."""
    def allow_request(self, request, view):
        payload = request.data if isinstance(request.data, dict) else {}
        email = request.user.email if request.user.is_authenticated else str(payload.get('email', '')).strip().lower()
        now = timezone.now()
        for identity, limit in ((f'email:{email}', 3), (f'peer:{request.META.get("REMOTE_ADDR", "")}', 30)):
            key = salted_hmac('email-action-limit', identity, algorithm='sha256').hexdigest()
            with transaction.atomic():
                LoginLimit.objects.get_or_create(key=key, defaults={'expires_at': now})
                bucket = LoginLimit.objects.select_for_update().get(pk=key)
                if bucket.expires_at <= now:
                    bucket.attempts = 0
                    bucket.expires_at = now + timedelta(minutes=15)
                if bucket.attempts >= limit:
                    raise Throttled(wait=max(1, int((bucket.expires_at - now).total_seconds())))
                bucket.attempts += 1
                bucket.save()
        return True
# SIRI.DEV
