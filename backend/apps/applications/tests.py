from django.test import override_settings
from rest_framework.test import APITestCase
from cryptography.fernet import Fernet
from apps.accounts.models import User
from apps.accounts.services import create_session_tokens, mfa_cipher
from apps.services.models import Service
from apps.documents.models import Document
from apps.payments.models import Payment
from .models import Application, StatusHistory
from unittest.mock import patch


@override_settings(MFA_ENCRYPTION_KEY=Fernet.generate_key().decode())
class OperationsSecurityTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email='owner@example.com', full_name='Owner')
        self.other = User.objects.create_user(email='other@example.com', full_name='Other')
        self.admin = User.objects.create_user(email='admin@example.com', full_name='Admin', role='admin')
        self.admin.admin_mfa_secret = mfa_cipher().encrypt(b'JBSWY3DPEHPK3PXP').decode()
        self.admin.save()
        service = Service.objects.create(name='Name change', category='Identity', description='Name change',
                                         base_price='1000.00', internal_cost='500.00')
        self.application = Application.objects.create(reference_no='NA-260916-0001', user=self.owner, service=service)
        self.document = Document.objects.create(application=self.application, doc_type='affidavit', file='private.pdf')
        self.payment = Payment.objects.create(application=self.application, user=self.owner, amount='1000.00')

    def authenticate(self, user, scope='customer'):
        token = create_session_tokens(user, scope)['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

    def test_customer_lists_and_details_only_include_owned_records(self):
        self.authenticate(self.other)
        for kind, obj in [('applications', self.application), ('documents', self.document), ('payments', self.payment)]:
            response = self.client.get(f'/api/v1/{kind}/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data['results'], [])
            self.assertEqual(self.client.get(f'/api/v1/{kind}/{obj.pk}/').status_code, 404)
            self.assertEqual(self.client.get(f'/api/v1/admin/{kind}/').status_code, 403)
        self.assertEqual(self.client.get(f'/api/v1/documents/{self.document.pk}/download/').status_code, 404)
        self.authenticate(self.owner)
        self.assertEqual(self.client.get(f'/api/v1/applications/{self.application.pk}/').status_code, 200)

    def test_customer_cannot_change_application_status(self):
        self.authenticate(self.owner)
        response = self.client.post(f'/api/v1/admin/applications/{self.application.pk}/status/', {'status': 'document_review'})
        self.assertEqual(response.status_code, 403)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'received')

    def test_admin_status_document_and_payment_changes_are_audited(self):
        self.authenticate(self.admin, 'admin')
        response = self.client.post(f'/api/v1/admin/applications/{self.application.pk}/status/', {'status': 'document_review'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(StatusHistory.objects.get().changed_by, self.admin)
        self.assertEqual(self.client.patch(f'/api/v1/admin/documents/{self.document.pk}/', {'is_deliverable': True}).status_code, 200)
        self.assertEqual(self.client.patch(f'/api/v1/admin/payments/{self.payment.pk}/', {'status': 'success'}).status_code, 200)
        from apps.core.models import AuditLog
        logs = AuditLog.objects.order_by('created_at')
        self.assertEqual(logs.count(), 3)
        self.assertTrue(all(log.actor_id == self.admin.pk for log in logs))
        self.assertEqual(logs[0].before, {'status': 'received'})
        self.assertEqual(logs[0].after, {'status': 'document_review'})
        self.assertEqual(logs[1].before['is_deliverable'], False)
        self.assertEqual(logs[1].after['is_deliverable'], True)
        self.assertEqual(logs[2].before['status'], 'pending')
        self.assertEqual(logs[2].after['status'], 'success')
        self.assertEqual(self.client.patch(f'/api/v1/admin/audit-logs/{logs[0].pk}/', {'action': 'hidden'}).status_code, 405)

    def test_invalid_transition_does_not_change_state_or_create_audit(self):
        self.authenticate(self.admin, 'admin')
        response = self.client.post(f'/api/v1/admin/applications/{self.application.pk}/status/', {'status': 'completed'})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(StatusHistory.objects.exists())
        from apps.core.models import AuditLog
        self.assertFalse(AuditLog.objects.exists())

    def test_documents_do_not_expose_storage_paths_or_unchecked_download_urls(self):
        self.authenticate(self.owner)
        response = self.client.get(f'/api/v1/documents/{self.document.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('file', response.data)

    def test_status_change_rolls_back_when_audit_write_fails(self):
        self.authenticate(self.admin, 'admin')
        with patch('apps.core.services.AuditLog.objects.create', side_effect=RuntimeError('Database failure')):
            with self.assertRaises(RuntimeError):
                self.client.post(f'/api/v1/admin/applications/{self.application.pk}/status/', {'status': 'document_review'})
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'received')
        self.assertFalse(StatusHistory.objects.exists())

    @override_settings(STORAGES={'default': {'BACKEND': 'storages.backends.s3.S3Storage'}},
                       AWS_ACCESS_KEY_ID='test-access', AWS_SECRET_ACCESS_KEY='test-secret',
                       AWS_STORAGE_BUCKET_NAME='private-documents', AWS_S3_REGION_NAME='eu-west-1')
    def test_owned_document_download_is_a_short_lived_signed_url(self):
        from urllib.parse import urlsplit, parse_qs
        self.authenticate(self.owner)
        response = self.client.get(f'/api/v1/documents/{self.document.pk}/download/')
        self.assertEqual(response.status_code, 200)
        query = parse_qs(urlsplit(response.data['url']).query)
        self.assertIn('X-Amz-Signature', query)
        self.assertEqual(query['X-Amz-Expires'], ['300'])
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_every_operations_route_rejects_anonymous_and_customer_requests(self):
        routes = ['applications', 'documents', 'payments', 'customers', 'audit-logs']
        for route in routes:
            self.assertEqual(self.client.get(f'/api/v1/admin/{route}/').status_code, 401)
        self.authenticate(self.owner)
        for route in routes:
            self.assertEqual(self.client.get(f'/api/v1/admin/{route}/').status_code, 403)
# SIRI.DEV
