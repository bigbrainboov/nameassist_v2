import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.accounts.services import create_session_tokens
from apps.applications.models import Application
from apps.documents.models import Document

class SubmissionTests(APITestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.settings_override = override_settings(
            STORAGES={'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                      'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}},
            MEDIA_ROOT=self.directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.owner = User.objects.create_user(email='applicant@example.com', full_name='Applicant')
        self.other = User.objects.create_user(email='other@example.com', full_name='Other')
        self.authenticate(self.owner)

    def authenticate(self, user):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(user)['access'])

    def payload(self, **changes):
        data = dict(submission_id=str(uuid.uuid4()), former_title='Ms', former_first_name='Ada',
                    former_middle_name='', former_last_name='Obi', new_title='Mrs',
                    new_first_name='Ada', new_middle_name='', new_last_name='Okafor',
                    email='ada@example.com', phone='+2348012345678', newspaper='punch',
                    affidavit=SimpleUploadedFile('affidavit.pdf', b'%PDF-1.4\n%%EOF', 'application/pdf'))
        data.update(changes)
        return data

    def submit(self, data=None):
        return self.client.post('/api/v1/applications/change-of-name/', data or self.payload(), format='multipart')

    def test_submission_persists_fields_files_and_only_owner_can_read(self):
        response = self.submit()
        self.assertEqual(response.status_code, 201, response.data)
        app_id = response.data['id']
        self.assertEqual(response.data['change_of_name']['new_last_name'], 'Okafor')
        self.assertEqual(response.data['change_of_name']['newspaper_name'], 'Punch')
        self.assertEqual(response.data['status'], 'received')
        document = Document.objects.get(application_id=app_id)
        self.assertEqual(document.uploaded_by, self.owner)
        self.assertTrue(document.file.storage.exists(document.file.name))
        self.assertEqual(Application.objects.get(pk=app_id).status_history.count(), 1)
        self.authenticate(self.other)
        self.assertEqual(self.client.get(f'/api/v1/applications/{app_id}/').status_code, 404)
        self.assertEqual(self.client.get(f'/api/v1/documents/{document.id}/content/').status_code, 404)

    def test_invalid_or_missing_upload_does_not_create_application(self):
        data = self.payload()
        del data['affidavit']
        self.assertEqual(self.submit(data).status_code, 400)
        bad = SimpleUploadedFile('fake.pdf', b'<script>bad</script>', 'application/pdf')
        self.assertEqual(self.submit(self.payload(affidavit=bad)).status_code, 400)
        self.assertEqual(Application.objects.count(), 0)

    def test_anonymous_submission_rejected(self):
        self.client.credentials()
        self.assertEqual(self.submit().status_code, 401)

    def test_catalog_and_unavailable_newspaper(self):
        from apps.applications.models import Newspaper
        Newspaper.objects.filter(slug='punch').update(is_available=False)
        catalog = self.client.get('/api/v1/applications/options/')
        self.assertEqual(catalog.status_code, 200)
        self.assertNotIn('punch', [item['slug'] for item in catalog.data['newspapers']])
        self.assertEqual(self.submit().status_code, 400)
        self.assertEqual(Application.objects.count(), 0)

    def test_retry_returns_same_application_without_duplicate_files(self):
        submission_id = str(uuid.uuid4())
        first = self.submit(self.payload(submission_id=submission_id))
        second = self.submit(self.payload(submission_id=submission_id))
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(first.data['id'], second.data['id'])
        self.assertEqual(Application.objects.count(), 1)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(len([p for p in Path(self.directory.name).rglob('*') if p.is_file()]), 1)
        from apps.notifications.models import Notification
        self.assertEqual(Notification.objects.filter(type='request_received').count(), 1)

    def test_local_document_content_requires_authentication(self):
        response = self.submit()
        self.assertEqual(response.status_code, 201, response.data)
        document = Document.objects.get()
        download = self.client.get(f'/api/v1/documents/{document.id}/content/')
        self.assertEqual(download.status_code, 200)
        self.assertEqual(b''.join(download.streaming_content), b'%PDF-1.4\n%%EOF')
        self.assertEqual(download['Cache-Control'], 'no-store')
        self.client.credentials()
        self.assertEqual(self.client.get(f'/api/v1/documents/{document.id}/content/').status_code, 401)

    def test_multiple_optional_documents_are_persisted(self):
        data = self.payload(education=[SimpleUploadedFile('degree.pdf', b'%PDF-1.4\n%%EOF'),
                                       SimpleUploadedFile('certificate.pdf', b'%PDF-1.4\n%%EOF')])
        response = self.submit(data)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Document.objects.filter(doc_type='education').count(), 2)

    def test_storage_failure_rolls_back_records_and_cleans_written_files(self):
        from django.core.files.storage import FileSystemStorage
        original_save = FileSystemStorage.save
        count = 0
        def fail_second(storage, *args, **kwargs):
            nonlocal count
            count += 1
            if count == 2:
                raise OSError('storage unavailable')
            return original_save(storage, *args, **kwargs)
        with patch.object(FileSystemStorage, 'save', fail_second):
            with self.captureOnCommitCallbacks(execute=True):
                with self.assertRaises(OSError):
                    self.submit(self.payload(nin=[SimpleUploadedFile('nin.pdf', b'%PDF-1.4\n%%EOF')]))
        self.assertFalse(Application.objects.exists())
        self.assertFalse(Document.objects.exists())
        from apps.notifications.models import Notification
        self.assertFalse(Notification.objects.exists())
        self.assertFalse(any(path.is_file() for path in Path(self.directory.name).rglob('*')))

    def test_ambiguous_upload_failure_is_queued_for_cleanup(self):
        from django.core.files.storage import FileSystemStorage
        from django.core.management import call_command
        from apps.documents.models import PendingFileDeletion
        from io import StringIO
        original_save = FileSystemStorage.save

        def save_then_timeout(storage, *args, **kwargs):
            original_save(storage, *args, **kwargs)
            raise OSError('response lost after upload')

        with patch.object(FileSystemStorage, 'save', save_then_timeout):
            with patch.object(FileSystemStorage, 'delete', side_effect=OSError('storage offline')):
                with self.captureOnCommitCallbacks(execute=True):
                    with self.assertRaises(OSError):
                        self.submit()
        self.assertFalse(Application.objects.exists())
        self.assertEqual(PendingFileDeletion.objects.count(), 1)
        call_command('cleanup_document_files', stdout=StringIO())
        self.assertFalse(PendingFileDeletion.objects.exists())
        self.assertFalse(any(path.is_file() for path in Path(self.directory.name).rglob('*')))

    def test_file_limits_and_unknown_categories_rejected(self):
        too_large = SimpleUploadedFile('large.pdf', b'%PDF-' + b'x' * (10 * 1024 * 1024))
        self.assertEqual(self.submit(self.payload(affidavit=too_large)).status_code, 400)
        many = [SimpleUploadedFile(f'{i}.pdf', b'%PDF-1.4\n%%EOF') for i in range(10)]
        self.assertEqual(self.submit(self.payload(education=many)).status_code, 400)
        unknown = SimpleUploadedFile('other.pdf', b'%PDF-1.4\n%%EOF')
        self.assertEqual(self.submit(self.payload(unrecognized=unknown)).status_code, 400)
        self.assertFalse(Application.objects.exists())

    def test_status_and_owner_cannot_be_supplied_by_customer(self):
        response = self.submit(self.payload(user=str(self.other.id), status='completed'))
        self.assertEqual(response.status_code, 201, response.data)
        application = Application.objects.get()
        self.assertEqual(application.user, self.owner)
        self.assertEqual(application.status, 'received')

    def test_unavailable_service_and_invalid_fields_rejected(self):
        from apps.services.models import Service
        self.assertEqual(self.submit(self.payload(new_first_name='  ')).status_code, 400)
        self.assertEqual(self.submit(self.payload(phone='-------')).status_code, 400)
        Service.objects.filter(slug='change-of-name').update(is_active=False)
        self.assertEqual(self.submit().status_code, 400)
        self.assertFalse(Application.objects.exists())

    def test_staff_account_cannot_submit(self):
        self.owner.role = 'staff'
        self.owner.save()
        self.authenticate(self.owner)
        self.assertEqual(self.submit().status_code, 403)

    def test_saved_submission_can_be_retried_after_newspaper_disabled(self):
        from apps.applications.models import Newspaper
        submission_id = str(uuid.uuid4())
        first = self.submit(self.payload(submission_id=submission_id))
        self.assertEqual(first.status_code, 201, first.data)
        Newspaper.objects.filter(slug='punch').update(is_available=False)
        retry = self.submit(self.payload(submission_id=submission_id))
        self.assertEqual(retry.status_code, 200, retry.data)
        self.assertEqual(retry.data['id'], first.data['id'])
        self.assertEqual(Document.objects.count(), 1)

    def test_local_admin_download_url_keeps_admin_authorization(self):
        self.submit()
        document = Document.objects.get()
        from apps.accounts.services import mfa_cipher
        with override_settings(MFA_ENCRYPTION_KEY='test-mfa-encryption-key-of-at-least-32-characters'):
            admin = User.objects.create_user(email='admin@example.com', role='admin', full_name='Admin',
                                             admin_mfa_secret=mfa_cipher().encrypt(b'JBSWY3DPEHPK3PXP').decode())
        token = create_session_tokens(admin, 'admin')['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.get(f'/api/v1/admin/documents/{document.pk}/download/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(f'/admin/documents/{document.pk}/content/', response.data['url'])
        self.assertEqual(response['Cache-Control'], 'no-store')
        download = self.client.get(response.data['url'])
        self.assertEqual(download.status_code, 200)
        self.assertEqual(b''.join(download.streaming_content), b'%PDF-1.4\n%%EOF')

    def test_operator_can_disable_and_add_catalog_entries(self):
        from django.core.management import call_command
        from io import StringIO
        call_command('newspaper_catalog', 'punch', '--unavailable', stdout=StringIO())
        options = self.client.get('/api/v1/applications/options/').data
        self.assertNotIn('punch', [paper['slug'] for paper in options['newspapers']])
        call_command('newspaper_catalog', 'example', '--name', 'Example', '--logo-url', '/assets/example.png',
                     '--available', stdout=StringIO())
        options = self.client.get('/api/v1/applications/options/').data
        self.assertIn('example', [paper['slug'] for paper in options['newspapers']])

    def test_identical_uploads_share_fingerprint_but_keep_application_links(self):
        first = self.submit()
        second = self.submit(self.payload(affidavit=SimpleUploadedFile('renamed.pdf', b'%PDF-1.4\n%%EOF', 'application/pdf')))
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        documents = list(Document.objects.order_by('created_at'))
        self.assertEqual(len(documents), 2)
        self.assertEqual(len(documents[0].content_sha256), 64)
        self.assertEqual(documents[0].content_sha256, documents[1].content_sha256)
        self.assertNotEqual(documents[0].application_id, documents[1].application_id)
        response = self.client.get('/api/v1/documents/')
        self.assertEqual(response.data['results'][0]['content_sha256'], documents[0].content_sha256)
        for document in documents:
            self.assertEqual(self.client.get(f'/api/v1/documents/{document.pk}/content/').status_code, 200)

    def test_different_contents_with_same_filename_have_different_fingerprints(self):
        self.submit()
        self.submit(self.payload(affidavit=SimpleUploadedFile('affidavit.pdf', b'%PDF-1.4\nother contents\n%%EOF', 'application/pdf')))
        self.assertEqual(len(set(Document.objects.values_list('content_sha256', flat=True))), 2)

    def test_existing_document_fingerprints_can_be_backfilled_without_deleting_records(self):
        from django.core.management import call_command
        from io import StringIO
        self.submit()
        expected = Document.objects.get().content_sha256
        Document.objects.update(content_sha256='')
        output = StringIO()
        call_command('fingerprint_documents', stdout=output)
        self.assertEqual(Document.objects.get().content_sha256, expected)
        call_command('fingerprint_documents', stdout=output)
        self.assertIn('Fingerprinted 0 documents', output.getvalue())

    def test_unreadable_document_is_left_ungrouped(self):
        from django.core.management import call_command
        from io import StringIO
        self.submit()
        document = Document.objects.get()
        document.file.storage.delete(document.file.name)
        Document.objects.update(content_sha256='')
        call_command('fingerprint_documents', stdout=StringIO(), stderr=StringIO())
        document.refresh_from_db()
        self.assertEqual(document.content_sha256, '')
# SIRI.DEV
