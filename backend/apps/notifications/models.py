from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.applications.models import Application

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    type = models.CharField(max_length=100)
    channel = models.CharField(max_length=50)
    sent_at = models.DateTimeField(null=True, blank=True)

    event_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    recipient = models.EmailField(blank=True, default='')
    subject = models.CharField(max_length=255, blank=True, default='')
    payload = models.TextField(blank=True, default='')
    state = models.CharField(max_length=20, default='legacy', db_index=True)
    provider_message_id = models.CharField(max_length=255, blank=True, default='')
    attempts = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(null=True, blank=True, db_index=True)
    lease_at = models.DateTimeField(null=True, blank=True)
    first_attempt_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"{self.type} to {self.user.email}"
# SIRI.DEV
