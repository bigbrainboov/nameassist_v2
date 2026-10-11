from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.services.models import Service

class Application(TimeStampedModel):
    reference_no = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='applications')
    status = models.CharField(max_length=50, default='received')
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.reference_no} - {self.user.email}"

class StatusHistory(TimeStampedModel):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='status_changes')
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.application.reference_no} -> {self.status}"


class Newspaper(TimeStampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    logo_url = models.CharField(max_length=500, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ChangeOfNameDetails(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='change_of_name')
    submission_id = models.UUIDField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    former_title = models.CharField(max_length=30)
    former_first_name = models.CharField(max_length=100)
    former_middle_name = models.CharField(max_length=100, blank=True)
    former_last_name = models.CharField(max_length=100)
    new_title = models.CharField(max_length=30)
    new_first_name = models.CharField(max_length=100)
    new_middle_name = models.CharField(max_length=100, blank=True)
    new_last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    newspaper = models.ForeignKey(Newspaper, on_delete=models.PROTECT)
    newspaper_name = models.CharField(max_length=100)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'submission_id'], name='unique_customer_submission')]
# SIRI.DEV
