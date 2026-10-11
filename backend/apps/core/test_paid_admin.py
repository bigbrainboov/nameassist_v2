from decimal import Decimal
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.accounts.services import create_session_tokens
from apps.applications.models import Application
from apps.documents.models import Document
from apps.payments.models import Payment
from apps.services.models import Service


@override_settings(PAYSTACK_SECRET_KEY='sk_test_admin_queue', STORAGES={'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'}})
class PaidAdminQueueTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin-queue@example.com', role='admin', admin_mfa_secret='enrolled')
        self.customer = User.objects.create_user(email='queue-customer@example.com', full_name='Ada Example')
        self.service = Service.objects.create(name='Queue service', slug='queue-service', base_price=Decimal('100'), internal_cost=0)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.admin, 'admin')['access'])

    def application(self, reference, payment_status=None, verified=False, mode='test'):
        app = Application.objects.create(user=self.customer, service=self.service, reference_no=reference, payment_amount=100)
        if payment_status:
            Payment.objects.create(application=app, user=self.customer, amount=100, status=payment_status,
                gateway_mode=mode, verified_at=timezone.now() if verified else None, gateway_reference='PAY-' + reference)
        return app

    def test_queue_only_contains_verified_success_in_current_environment(self):
        paid = self.application('PAID', 'success', True)
        self.application('UNPAID')
        self.application('PENDING', 'pending')
        self.application('FAILED', 'failed')
        self.application('UNVERIFIED', 'success')
        self.application('OTHER-MODE', 'success', True, 'live')
        # Two successful records must not duplicate the application in the queue.
        Payment.objects.create(application=paid, user=self.customer, amount=100, status='success', gateway_mode='test',
            verified_at=timezone.now(), gateway_reference='SECOND-SUCCESS')
        response = self.client.get('/api/v1/admin/applications/?payment_status=paid')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        row = response.data['results'][0]
        self.assertEqual(row['id'], str(paid.pk))
        self.assertEqual(row['customer_name'], 'Ada Example')
        self.assertEqual(row['customer_email'], self.customer.email)
        self.assertEqual(row['allowed_transitions'], ['document_review'])
        self.assertEqual(row['payment']['status'], 'paid')

    def test_customer_session_cannot_read_admin_queue(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.customer)['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/?payment_status=paid').status_code, 403)
        self.client.credentials()
        self.assertEqual(self.client.get('/api/v1/admin/applications/?payment_status=paid').status_code, 401)

    def test_paid_status_update_is_saved_and_visible_to_customer(self):
        app = self.application('ADVANCE', 'success', True)
        response = self.client.post(f'/api/v1/admin/applications/{app.pk}/status/',
            {'status': 'document_review', 'note': 'We are reviewing your affidavit.'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['allowed_transitions'], ['processing'])
        self.assertEqual(response.data['customer_name'], 'Ada Example')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.customer)['access'])
        response = self.client.get(f'/api/v1/applications/{app.pk}/')
        self.assertEqual(response.data['status'], 'document_review')
        self.assertEqual(response.data['status_history'][0]['note'], 'We are reviewing your affidavit.')

    def test_admin_documents_are_filtered_to_selected_application(self):
        app = self.application('ONE', 'success', True)
        other = self.application('TWO', 'success', True)
        document = Document.objects.create(application=app, doc_type='affidavit', file='one.pdf')
        Document.objects.create(application=other, doc_type='affidavit', file='two.pdf')
        response = self.client.get(f'/api/v1/admin/documents/?application={app.pk}')
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(document.pk))
        self.assertEqual(self.client.get('/api/v1/admin/documents/?application=bad').status_code, 400)

    def test_unpaid_application_cannot_be_advanced_by_direct_request(self):
        app = self.application('UNPAID-DIRECT')
        response = self.client.post(f'/api/v1/admin/applications/{app.pk}/status/', {'status': 'document_review'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_full_pipeline_is_visible_to_customer_and_audited(self):
        from apps.core.models import AuditLog
        app = self.application('FULL-PIPELINE', 'success', True)
        admin_access = create_session_tokens(self.admin, 'admin')['access']
        customer_access = create_session_tokens(self.customer)['access']
        stages = ['document_review', 'processing', 'newspaper_publication', 'final_documentation', 'completed']
        for stage in stages:
            self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_access)
            if stage == 'completed':
                blocked = self.client.post(f'/api/v1/admin/applications/{app.pk}/status/', {'status': stage}, format='json')
                self.assertEqual(blocked.status_code, 400)
                Document.objects.create(application=app, doc_type='final_document', file='completed.pdf', is_deliverable=True)
            response = self.client.post(f'/api/v1/admin/applications/{app.pk}/status/',
                {'status': stage, 'note': f'Update: {stage}'}, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + customer_access)
            visible = self.client.get(f'/api/v1/applications/{app.pk}/')
            self.assertEqual(visible.data['status'], stage)
            self.assertTrue(any(event['note'] == f'Update: {stage}' for event in visible.data['status_history']))
        self.assertEqual(app.status_history.count(), 5)
        self.assertEqual(AuditLog.objects.filter(action='status_change').count(), 5)

    def test_outdated_dropdown_cannot_overwrite_newer_stage(self):
        app = self.application('CONCURRENT-STAGE', 'success', True)
        url = f'/api/v1/admin/applications/{app.pk}/status/'
        self.assertEqual(self.client.post(url, {'status': 'document_review'}, format='json').status_code, 200)
        self.assertEqual(self.client.post(url, {'status': 'document_review'}, format='json').status_code, 400)
        app.refresh_from_db()
        self.assertEqual(app.status, 'document_review')
        self.assertEqual(app.status_history.count(), 1)

    def test_admin_upload_deliverable_document(self):
        # Create an application
        app = Application.objects.create(reference_no='NA-UPLOAD-TEST', user=self.customer, service=self.service, status='processing')
        
        # Admin uploads the document
        from django.core.files.uploadedfile import SimpleUploadedFile
        test_file = SimpleUploadedFile("completed.pdf", b"%PDF-1.4\nfile_content", content_type="application/pdf")
        
        response = self.client.post('/api/v1/admin/documents/upload/', {
            'application': app.id,
            'file': test_file,
            'doc_type': 'final_document'
        }, format='multipart')
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['is_deliverable'])
        self.assertEqual(response.data['doc_type'], 'final_document')
        self.assertEqual(response.data['original_filename'], 'completed.pdf')
        
        # Check audit log
        from apps.core.models import AuditLog
        audit = AuditLog.objects.filter(target_id=response.data['id'], action='admin_document_upload').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor, self.admin)

    @override_settings(STORAGES={'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'}})
    def test_admin_upload_rejects_invalid_files_without_saving(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.core.files.storage import default_storage
        from apps.core.models import AuditLog
        app = self.application('INVALID-UPLOAD')
        for filename, content in [
            ('fake.pdf', b'not a PDF'),
            ('script.exe', b'%PDF-1.4'),
            ('large.pdf', b'%PDF-' + b'x' * (10 * 1024 * 1024)),
        ]:
            with self.subTest(filename=filename):
                response = self.client.post('/api/v1/admin/documents/upload/', {
                    'application': app.id,
                    'file': SimpleUploadedFile(filename, content),
                }, format='multipart')
                self.assertEqual(response.status_code, 400)
                self.assertFalse(Document.objects.filter(application=app).exists())
                self.assertFalse(AuditLog.objects.filter(action='admin_document_upload').exists())
                self.assertEqual(default_storage.listdir(''), ([], []))

    def test_admin_disburse_referral_reward(self):
        from apps.payments.models import ReferralReward
        # Setup Referrer with bank details
        self.customer.bank_name = 'First Bank'
        self.customer.account_number = '1234567890'
        self.customer.account_name = 'Test User'
        self.customer.save()
        
        # Setup Referred User
        referred = User.objects.create_user(email='referred@example.com', password='password123', full_name='Referred')
        
        # Create Reward
        reward = ReferralReward.objects.create(
            referrer=self.customer,
            referred_user=referred,
            amount=500.00,
            status='pending'
        )
        
        response = self.client.post('/api/v1/admin/referral-rewards/disburse/', {
            'reward_id': reward.id, 'amount': '500.00', 'payment_reference': 'MANUAL-TEST', 'confirmed_paid': True,
            'bank_details': {'bank_name': 'First Bank', 'account_number': '1234567890', 'account_name': 'Test User'}
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'paid')
        self.assertIsNotNone(response.data['gateway_reference'])
        
        reward.refresh_from_db()
        self.assertEqual(reward.status, 'paid')
        
        # Verify Audit Log
        from apps.core.models import AuditLog
        audit = AuditLog.objects.filter(target_id=reward.id, action='record_referral_payment').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor, self.admin)
        
    def test_admin_disburse_referral_reward_missing_bank_details(self):
        from apps.payments.models import ReferralReward
        # Setup Referrer without bank details
        referrer_no_bank = User.objects.create_user(email='nobank@example.com', password='password123', full_name='No Bank')
        referred = User.objects.create_user(email='referred2@example.com', password='password123', full_name='Referred 2')
        
        reward = ReferralReward.objects.create(
            referrer=referrer_no_bank,
            referred_user=referred,
            amount=500.00,
            status='pending'
        )
        
        response = self.client.post('/api/v1/admin/referral-rewards/disburse/', {
            'reward_id': reward.id, 'amount': '500.00', 'payment_reference': 'MANUAL-TEST', 'confirmed_paid': True,
            'bank_details': {'bank_name': 'First Bank', 'account_number': '1234567890', 'account_name': 'Test User'}
        }, format='json')
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Referrer has not provided complete bank details.')
# SIRI.DEV
