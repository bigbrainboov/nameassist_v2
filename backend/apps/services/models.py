from django.db import models
from apps.core.models import TimeStampedModel

class Service(TimeStampedModel):
    slug = models.SlugField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    internal_cost = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
# SIRI.DEV
