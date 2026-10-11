from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.applications.models import Application

class Payment(TimeStampedModel):
    PROVIDER_CHOICES = (
        ('paystack', 'Paystack'),
    )

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='paystack')
    status = models.CharField(max_length=50, default='pending')
    gateway_reference = models.CharField(max_length=100, unique=True, null=True, blank=True)

    gateway_mode = models.CharField(max_length=4, blank=True)
    currency = models.CharField(max_length=3, default='NGN')
    payer_email = models.EmailField(blank=True)
    checkout_url = models.URLField(max_length=500, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.amount} for {self.application.reference_no} ({self.status})"

class ReferralReward(TimeStampedModel):
    payment_method = models.CharField(max_length=20, blank=True, default='',
        choices=[('manual', 'Manual payment'), ('legacy_mock', 'Legacy simulated payment'), ('legacy', 'Legacy record')])
    referrer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rewards_earned')
    referred_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reward_generated')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('paid', 'Paid')], default='pending')
    disbursed_at = models.DateTimeField(null=True, blank=True)
    gateway_reference = models.CharField(max_length=100, unique=True, null=True, blank=True)

    def __str__(self):
        return f"Reward {self.amount} to {self.referrer.email} for {self.referred_user.email} ({self.status})"
# SIRI.DEV
