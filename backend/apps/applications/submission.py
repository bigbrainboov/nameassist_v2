"""Customer intake: validate before writing, persist files privately, and retry safely."""
import logging
import uuid

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User
from apps.documents.models import Document
from apps.documents.fingerprints import fingerprint_file
from apps.documents.services import document_snapshot, record_document_change, queue_file_deletion
from apps.documents.validation import DOCUMENT_TYPES, MAX_FILES, MAX_FILE_SIZE, validate_upload
from apps.services.models import Service
from .models import Application, ChangeOfNameDetails, Newspaper, StatusHistory

logger = logging.getLogger(__name__)


class SubmissionSerializer(serializers.ModelSerializer):
    submission_id = serializers.UUIDField()
    newspaper = serializers.SlugRelatedField(slug_field='slug', queryset=Newspaper.objects.filter(is_available=True))
    affidavit = serializers.FileField(validators=[validate_upload])
    nin = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    bvn_bank = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    passport = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    drivers_license = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    education = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    work = serializers.ListField(child=serializers.FileField(validators=[validate_upload]), required=False)
    phone = serializers.RegexField(r'^\+?[0-9 ()-]{7,30}$')

    class Meta:
        model = ChangeOfNameDetails
        fields = ['submission_id', 'former_title', 'former_first_name', 'former_middle_name',
                  'former_last_name', 'new_title', 'new_first_name', 'new_middle_name', 'new_last_name',
                  'email', 'phone', 'newspaper', *DOCUMENT_TYPES]

    def validate(self, attrs):
        count = 1 + sum(len(attrs.get(key, [])) for key in DOCUMENT_TYPES if key != 'affidavit')
        if count > MAX_FILES:
            raise serializers.ValidationError('Upload at most 10 files in total.')
        if len(''.join(c for c in attrs['phone'] if c.isdigit())) < 7:
            raise serializers.ValidationError({'phone': 'Enter a valid phone number.'})
        return attrs


def submit_application(user, data):
    if user.role != 'customer':
        raise PermissionDenied('Customer accounts are required to submit applications.')
    saved_files = []
    try:
        with transaction.atomic():
            # Serialize submissions per customer, including retries of the same request.
            User.objects.select_for_update().get(pk=user.pk)
            existing = ChangeOfNameDetails.objects.filter(user=user, submission_id=data['submission_id']).first()
            if existing:
                return existing.application, False
            newspaper = Newspaper.objects.select_for_update().get(pk=data['newspaper'].pk)
            if not newspaper.is_available:
                raise serializers.ValidationError({'newspaper': 'This newspaper is no longer available. Please select another.'})
            service = Service.objects.filter(slug='change-of-name', is_active=True).first()
            if service is None:
                raise serializers.ValidationError({'detail': 'Change of Name applications are currently unavailable.'})
            uploads = {'affidavit': [data.pop('affidavit')]}
            for key in DOCUMENT_TYPES:
                if key != 'affidavit':
                    uploads[key] = data.pop(key, [])
            application = Application.objects.create(
                user=user, service=service,
                reference_no=f"NA-{timezone.now():%y%m%d}-{uuid.uuid4().hex.upper()}",
                status='received', payment_amount=service.base_price,
            )
            ChangeOfNameDetails.objects.create(application=application, user=user,
                                               newspaper_name=newspaper.name, **data)
            for kind, files in uploads.items():
                for upload in files:
                    document = Document(application=application, doc_type=kind, uploaded_by=user,
                                        content_sha256=fingerprint_file(upload), original_filename=upload.name)
                    name = document.file.field.generate_filename(document, upload.name)
                    # Track the key before sending bytes: R2 may accept an upload whose response times out.
                    saved_files.append(name)
                    document.file = document.file.storage.save(name, upload, max_length=512)
                    saved_files[-1] = document.file.name
                    document.save()
                    record_document_change(user, document, 'document_upload', {}, document_snapshot(document))
            StatusHistory.objects.create(application=application, status='received', changed_by=user,
                                         note='Application submitted by customer.')
            from apps.notifications.services import notify_application_received
            notify_application_received(application)
            return application, True
    except Exception:
        # Storage writes do not participate in database transactions.
        for name in saved_files:
            try:
                queue_file_deletion(name)
            except Exception:
                logger.exception('Could not persist cleanup for an uncommitted application upload')
        raise
# SIRI.DEV
