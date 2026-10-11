"""Customer document mutations serialize with application status transitions."""
import logging
from pathlib import Path

from botocore.exceptions import BotoCoreError, ClientError
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from apps.applications.models import Application
from apps.core.models import AuditLog
from .fingerprints import fingerprint_file
from .models import Document, PendingFileDeletion
from .validation import MAX_FILES, validate_upload

logger = logging.getLogger(__name__)


class DocumentConflict(APIException):
    status_code = 409
    default_detail = 'This document changed. Refresh your documents and try again.'


class StorageUnavailable(APIException):
    status_code = 503
    default_detail = 'Document storage is unavailable. Your existing documents are unchanged; please retry.'


def can_manage_application(application):
    return application.status == 'received' and application.service.slug == 'change-of-name'


def can_replace_document(document):
    return (can_manage_application(document.application) and not document.is_deliverable
            and document.uploaded_by_id == document.application.user_id)


def document_snapshot(document):
    return {'application': str(document.application_id), 'doc_type': document.doc_type,
            'file_name': document.file.name, 'content_sha256': document.content_sha256,
            'original_filename': document.original_filename}


def record_document_change(user, document, action, before, after):
    # Kept separate from the admin-only audit helper: customers cannot audit arbitrary targets.
    if (not user.is_active or user.role != 'customer' or document.application.user_id != user.pk
            or document.uploaded_by_id != user.pk or document.is_deliverable):
        raise PermissionDenied('You can only change your own uploaded documents.')
    AuditLog.objects.create(actor=user, actor_email=user.email, action=action,
                            target_type=document._meta.label_lower, target_id=document.pk,
                            before=before, after=after)


def cleanup_pending_files(limit=20):
    """Retry persisted work. Called after mutations and by the management command."""
    completed = 0
    ids = list(PendingFileDeletion.objects.order_by('updated_at').values_list('pk', flat=True)[:limit])
    for pk in ids:
        with transaction.atomic():
            job = PendingFileDeletion.objects.select_for_update().filter(pk=pk).first()
            if job is None:
                continue
            # Protect legacy records that may share a storage key.
            if Document.objects.filter(file=job.file_name).exists():
                job.delete()
                continue
            try:
                default_storage.delete(job.file_name)
            except Exception as exc:
                job.attempts = F('attempts') + 1
                job.last_error = type(exc).__name__
                job.save(update_fields=['attempts', 'last_error', 'updated_at'])
                logger.warning('Document cleanup deferred', extra={'cleanup_id': str(pk)})
            else:
                job.delete()
                completed += 1
    return completed


def queue_file_deletion(name):
    if name:
        PendingFileDeletion.objects.get_or_create(file_name=name)
    transaction.on_commit(cleanup_pending_files, robust=True)


def locked_application(user, application_id):
    if user.role != 'customer':
        raise PermissionDenied('Customer accounts are required to manage uploads.')
    application = get_object_or_404(Application.objects.select_for_update().select_related('service'),
                                    pk=application_id, user=user)
    if not can_manage_application(application):
        raise DocumentConflict('Documents are locked once document review begins.')
    return application


def mutate_document(user, *, application_id=None, document_id=None, upload=None, doc_type=None, updated_at=None):
    """Write a new object before switching records; delete old objects only after commit."""
    new_name = None
    storage = default_storage
    try:
        with transaction.atomic():
            if document_id:
                # Resolve only owned records; the authoritative checks follow the application lock.
                existing = get_object_or_404(Document.objects.filter(application__user=user), pk=document_id)
                application_id = existing.application_id
            application = locked_application(user, application_id)
            if document_id:
                document = get_object_or_404(Document.objects.select_for_update(), pk=document_id, application=application)
                document.application = application
                if not can_replace_document(document):
                    raise PermissionDenied('Only your own uploaded documents can be changed. Completed files are read-only.')
                if updated_at != document.updated_at:
                    raise DocumentConflict()
                if upload is None and document.doc_type == 'affidavit':
                    raise ValidationError('The sworn affidavit is required. Replace it instead of deleting it.')
                before = document_snapshot(document)
            else:
                uploads = Document.objects.filter(application=application, is_deliverable=False)
                if uploads.count() >= MAX_FILES:
                    raise ValidationError('An application can contain at most 10 uploaded files.')
                if doc_type == 'affidavit' and uploads.filter(doc_type='affidavit').exists():
                    raise ValidationError('This application already has an affidavit. Replace it instead.')
                document = Document(application=application, uploaded_by=user, doc_type=doc_type)
                before = {}
            old_name = document.file.name
            if upload is not None:
                document.original_filename = Path(upload.name).name
                document.content_sha256 = fingerprint_file(upload)
                new_name = document.file.field.generate_filename(document, upload.name)
                try:
                    new_name = storage.save(new_name, upload, max_length=512)
                except (OSError, BotoCoreError, ClientError) as exc:
                    raise StorageUnavailable() from exc
                document.file = new_name
                document.save()
                record_document_change(user, document, 'document_replace' if document_id else 'document_upload',
                                       before, document_snapshot(document))
            else:
                record_document_change(user, document, 'document_delete', before, {})
                document.delete()
            queue_file_deletion(old_name)
            return document
    except Exception:
        if new_name:
            # This runs after rollback, so a failed DB write cannot leave a queued deletion of a live file.
            # Persist cleanup even when the upload response was ambiguous (e.g. network timeout).
            try:
                queue_file_deletion(new_name)
            except Exception:
                logger.exception('Could not persist cleanup for uncommitted document upload')
        raise

def admin_upload_document(admin_user, application_id, upload, doc_type='final_document'):
    """Allow admins to upload a deliverable document for an application."""
    validate_upload(upload)
    try:
        with transaction.atomic():
            application = get_object_or_404(Application.objects.select_for_update(), pk=application_id)
            
            document = Document(
                application=application,
                uploaded_by=admin_user,
                doc_type=doc_type,
                is_deliverable=True
            )
            
            document.original_filename = Path(upload.name).name
            document.content_sha256 = fingerprint_file(upload)
            
            storage = default_storage
            new_name = document.file.field.generate_filename(document, upload.name)
            
            try:
                new_name = storage.save(new_name, upload, max_length=512)
            except (OSError, BotoCoreError, ClientError) as exc:
                raise StorageUnavailable() from exc
                
            document.file = new_name
            document.save()
            
            # Use the admin audit log helper (which allows admins to audit) 
            # instead of customer-restricted record_document_change
            from apps.core.services import record_admin_change
            record_admin_change(admin_user, document, 'admin_document_upload', {}, document_snapshot(document))
            
            return document
    except Exception as e:
        logger.exception("Admin document upload failed")
        raise
# SIRI.DEV
