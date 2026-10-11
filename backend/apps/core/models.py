import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(TimeStampedModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    actor_email = models.EmailField()
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100)
    target_id = models.UUIDField()
    before = models.JSONField(default=dict)
    after = models.JSONField(default=dict)

    class Meta:
        ordering = ['-created_at', '-id']

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError('Audit records cannot be edited.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError('Audit records cannot be deleted.')
# SIRI.DEV
