from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.applications.models import Application
from pathlib import Path
import uuid


def document_upload_path(instance, filename):
    category = 'deliverables' if instance.is_deliverable else 'uploads'
    return (f'users/{instance.application.user_id}/applications/{instance.application_id}/'
            f'{category}/{uuid.uuid4().hex}{Path(filename).suffix.lower()}')

class Document(TimeStampedModel):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=100)
    file = models.FileField(upload_to=document_upload_path, max_length=512)
    original_filename = models.CharField(max_length=255, blank=True, default='')
    content_sha256 = models.CharField(max_length=64, blank=True, default='', editable=False)
    is_deliverable = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')

    def save(self, *args, **kwargs):
        if self.file and not self.file._committed:
            from .fingerprints import fingerprint_file
            self.content_sha256 = fingerprint_file(self.file)
            if kwargs.get('update_fields') is not None:
                kwargs['update_fields'] = set(kwargs['update_fields']) | {'content_sha256'}
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.doc_type} for {self.application.reference_no}"


class PendingFileDeletion(TimeStampedModel):
    """Durable cleanup after a committed delete/replacement; no file contents."""
    file_name = models.CharField(max_length=512, unique=True)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.CharField(max_length=100, blank=True, default='')
# SIRI.DEV
