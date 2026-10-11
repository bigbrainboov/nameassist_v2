import hashlib
import tempfile
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.accounts.services import create_session_tokens
from apps.applications.models import Application
from apps.core.models import AuditLog
from apps.documents.models import Document
from apps.services.models import Service


class DocumentManagementTests(APITestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        override = override_settings(
            STORAGES={'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                      'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}},
            MEDIA_ROOT=directory.name)
        override.enable()
        self.addCleanup(override.disable)
        self.owner = User.objects.create_user(email='documents@example.com')
        self.other = User.objects.create_user(email='other-documents@example.com')
        self.app = Application.objects.create(user=self.owner, service=Service.objects.get(slug='change-of-name'),
                                              reference_no='DOCUMENT-MANAGEMENT')
        self.affidavit = self.document('affidavit')
        self.authenticate(self.owner)

    def authenticate(self, user, scope='customer'):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(user, scope)['access'])

    def upload(self, contents=b'%PDF-1.4\noriginal\n%%EOF'):
        return SimpleUploadedFile('my-document.pdf', contents, 'application/pdf')

    def document(self, kind='nin', **kwargs):
        return Document.objects.create(application=self.app, uploaded_by=self.owner, doc_type=kind,
                                       file=self.upload(), **kwargs)

    def add(self, **kwargs):
        data = {'application': str(self.app.pk), 'doc_type': 'nin', 'file': self.upload()}
        data.update(kwargs)
        return self.client.post('/api/v1/documents/', data, format='multipart')

    def replace(self, doc, **kwargs):
        data = {'file': self.upload(b'%PDF-1.4\nreplacement\n%%EOF'), 'updated_at': doc.updated_at.isoformat()}
        data.update(kwargs)
        return self.client.post(f'/api/v1/documents/{doc.pk}/replace/', data, format='multipart')

    def delete(self, doc):
        return self.client.delete(f'/api/v1/documents/{doc.pk}/', {'updated_at': doc.updated_at.isoformat()}, format='json')

    def test_upload_uses_owner_application_prefix_and_server_owned_fields(self):
        response = self.add(uploaded_by=str(self.other.pk), is_deliverable='true', file_path='elsewhere')
        self.assertEqual(response.status_code, 201, response.data)
        doc = Document.objects.get(pk=response.data['id'])
        self.assertTrue(doc.file.name.startswith(f'users/{self.owner.pk}/applications/{self.app.pk}/uploads/'))
        self.assertNotIn('my-document', doc.file.name)
        self.assertEqual(doc.uploaded_by, self.owner)
        self.assertFalse(doc.is_deliverable)
        self.assertEqual(doc.original_filename, 'my-document.pdf')
        self.assertTrue(doc.file.storage.exists(doc.file.name))
        self.assertTrue(response.data['can_replace'])
        self.assertTrue(response.data['can_delete'])
        self.assertNotIn('file', response.data)
        self.assertTrue(AuditLog.objects.filter(actor=self.owner, target_id=doc.pk, action='document_upload').exists())

    def test_customer_cannot_mutate_another_customers_documents(self):
        doc = self.document()
        self.authenticate(self.other)
        self.assertEqual(self.add().status_code, 404)
        self.assertEqual(self.replace(doc).status_code, 404)
        self.assertEqual(self.delete(doc).status_code, 404)
        self.assertTrue(doc.file.storage.exists(doc.file.name))

    def test_anonymous_mutations_rejected(self):
        self.client.credentials()
        self.assertEqual(self.add().status_code, 401)
        self.assertEqual(self.replace(self.affidavit).status_code, 401)
        self.assertEqual(self.delete(self.affidavit).status_code, 401)

    def test_review_and_later_stages_lock_all_customer_mutations(self):
        doc = self.document()
        for stage in ('document_review', 'processing', 'newspaper_publication', 'final_documentation', 'completed'):
            with self.subTest(stage=stage):
                Application.objects.filter(pk=self.app.pk).update(status=stage)
                self.assertEqual(self.add().status_code, 409)
                self.assertEqual(self.replace(doc).status_code, 409)
                self.assertEqual(self.delete(doc).status_code, 409)
                response = self.client.get(f'/api/v1/documents/{doc.pk}/')
                self.assertFalse(response.data['can_replace'])
                self.assertFalse(response.data['can_delete'])

    def test_affidavit_cannot_be_deleted_or_duplicated_but_can_be_replaced(self):
        self.assertEqual(self.delete(self.affidavit).status_code, 400)
        self.assertEqual(self.add(doc_type='affidavit').status_code, 400)
        old_name = self.affidavit.file.name
        with self.captureOnCommitCallbacks(execute=True):
            response = self.replace(self.affidavit)
        self.assertEqual(response.status_code, 200, response.data)
        self.affidavit.refresh_from_db()
        self.assertNotEqual(self.affidavit.file.name, old_name)
        self.assertFalse(self.affidavit.file.storage.exists(old_name))
        self.assertEqual(self.affidavit.content_sha256, hashlib.sha256(b'%PDF-1.4\nreplacement\n%%EOF').hexdigest())
        self.assertFalse(response.data['can_delete'])
        self.assertTrue(AuditLog.objects.filter(action='document_replace', target_id=self.affidavit.pk).exists())

    def test_delete_removes_only_selected_copy_and_records_audit(self):
        first, second = self.document(), self.document()
        with self.captureOnCommitCallbacks(execute=True):
            response = self.delete(first)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(pk=first.pk).exists())
        self.assertFalse(first.file.storage.exists(first.file.name))
        self.assertTrue(second.file.storage.exists(second.file.name))
        audit = AuditLog.objects.get(action='document_delete', target_id=first.pk)
        self.assertEqual(audit.actor, self.owner)
        self.assertEqual(audit.before['application'], str(self.app.pk))

    def test_deliverables_and_admin_uploaded_files_cannot_be_changed(self):
        admin = User.objects.create_user(email='document-admin@example.com', role='admin')
        for doc in (self.document(is_deliverable=True), self.document()):
            if not doc.is_deliverable:
                doc.uploaded_by = admin
                doc.save()
            self.assertEqual(self.replace(doc).status_code, 403)
            self.assertEqual(self.delete(doc).status_code, 403)

    def test_stale_mutations_do_not_overwrite_a_new_version(self):
        doc = self.document()
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.replace(doc).status_code, 200)
        self.assertEqual(self.replace(doc).status_code, 409)
        self.assertEqual(self.delete(doc).status_code, 409)
        self.assertEqual(Document.objects.filter(pk=doc.pk).count(), 1)

    def test_validation_and_ten_upload_limit(self):
        self.assertEqual(self.add(file=SimpleUploadedFile('fake.pdf', b'not a PDF')).status_code, 400)
        self.assertEqual(self.add(doc_type='unknown').status_code, 400)
        self.assertEqual(self.add(file=self.upload(b'%PDF-' + b'x' * (10 * 1024 * 1024))).status_code, 400)
        for _ in range(9):
            self.document()
        self.assertEqual(self.add().status_code, 400)
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.replace(self.affidavit).status_code, 200)

    def test_failed_replacement_keeps_original_readable(self):
        old_name = self.affidavit.file.name
        with patch.object(FileSystemStorage, 'save', side_effect=OSError('storage offline')):
            response = self.replace(self.affidavit)
        self.assertEqual(response.status_code, 503)
        self.affidavit.refresh_from_db()
        self.assertEqual(self.affidavit.file.name, old_name)
        self.assertTrue(self.affidavit.file.storage.exists(old_name))
        self.assertFalse(AuditLog.objects.filter(action='document_replace').exists())

    def test_audit_failure_rolls_back_replacement_and_cleans_new_upload(self):
        old_name = self.affidavit.file.name
        with patch('apps.core.models.AuditLog.objects.create', side_effect=RuntimeError('audit unavailable')):
            with self.captureOnCommitCallbacks(execute=True):
                with self.assertRaises(RuntimeError):
                    self.replace(self.affidavit)
        self.affidavit.refresh_from_db()
        self.assertEqual(self.affidavit.file.name, old_name)
        self.assertEqual(len([p for p in self.directory.rglob('*') if p.is_file()]), 1)

    def test_failed_delete_cleanup_is_persisted_and_command_retries(self):
        from apps.documents.models import PendingFileDeletion
        doc = self.document()
        with patch.object(FileSystemStorage, 'delete', side_effect=OSError('storage offline')):
            with self.captureOnCommitCallbacks(execute=True):
                response = self.delete(doc)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(pk=doc.pk).exists())
        self.assertTrue(PendingFileDeletion.objects.filter(file_name=doc.file.name).exists())
        call_command('cleanup_document_files', stdout=StringIO())
        self.assertFalse(doc.file.storage.exists(doc.file.name))
        self.assertFalse(PendingFileDeletion.objects.exists())

    def test_admin_routes_do_not_inherit_customer_mutations(self):
        admin = User.objects.create_user(email='operations@example.com', role='admin', admin_mfa_secret='enrolled')
        self.authenticate(admin, 'admin')
        self.assertEqual(self.client.post('/api/v1/admin/documents/', {}, format='json').status_code, 405)
        self.assertEqual(self.client.delete(f'/api/v1/admin/documents/{self.affidavit.pk}/').status_code, 405)
        self.assertEqual(self.add().status_code, 403)
# SIRI.DEV
