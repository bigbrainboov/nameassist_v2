from decimal import Decimal
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.accounts.services import create_session_tokens
from apps.payments.models import ReferralReward
from apps.applications.models import Application
from apps.services.models import Service
from apps.core.models import AuditLog


@override_settings(STORAGES={'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'}})
class AdminReferralTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='operator@example.com', role='admin', admin_mfa_secret='enrolled')
        self.referrer = User.objects.create_user(email='referrer@example.com', full_name='Ada Example',
            bank_name='Example Bank', account_number='0123456789', account_name='Ada Example')
        self.referred = User.objects.create_user(email='referred@example.com', full_name='Tomi Example')
        self.reward = ReferralReward.objects.create(referrer=self.referrer, referred_user=self.referred)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.admin, 'admin')['access'])
        self.url = '/api/v1/admin/referral-rewards/disburse/'

    def payout(self, **changes):
        return self.client.post(self.url, {'reward_id': str(self.reward.pk), 'amount': '1250.50',
            'payment_reference': 'BANK-123', 'confirmed_paid': True, 'note': 'Transfer completed',
            'bank_details': {'bank_name': 'Example Bank', 'account_number': '0123456789', 'account_name': 'Ada Example'}, **changes}, format='json')

    def test_manual_payment_amount_and_history_are_saved_once(self):
        result = self.payout()
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(result.data['amount'], '1250.50')
        self.assertEqual(result.data['payment_method'], 'manual')
        self.assertEqual(result.data['gateway_reference'], 'BANK-123')
        self.reward.refresh_from_db()
        self.assertEqual(self.reward.status, 'paid')
        self.assertEqual(self.reward.amount, Decimal('1250.50'))
        self.referrer.account_number = '9999999999'
        self.referrer.save(update_fields=['account_number'])
        history = self.client.get(f'/api/v1/admin/referral-rewards/{self.reward.pk}/history/')
        self.assertEqual(history.status_code, 200)
        event = history.data[0]
        self.assertEqual(event['actor_email'], self.admin.email)
        self.assertEqual(event['before']['amount'], '500.00')
        self.assertEqual(event['after']['amount'], '1250.50')
        self.assertEqual(event['after']['account_number'], '0123456789')
        self.assertEqual(event['after']['note'], 'Transfer completed')
        self.assertEqual(self.payout(payment_reference='OTHER').status_code, 400)
        self.assertEqual(AuditLog.objects.filter(target_id=self.reward.pk).count(), 1)

    def test_invalid_amount_reference_confirmation_or_missing_bank_are_rejected(self):
        for changes in ({'amount': '0'}, {'amount': '-1'}, {'amount': '1.234'}, {'amount': '100000000.00'},
                        {'payment_reference': ''}, {'confirmed_paid': False}):
            with self.subTest(changes=changes):
                self.assertEqual(self.payout(**changes).status_code, 400)
        self.referrer.account_number = ''
        self.referrer.save(update_fields=['account_number'])
        self.assertEqual(self.payout().status_code, 400)
        self.reward.refresh_from_db()
        self.assertEqual(self.reward.status, 'pending')
        self.assertFalse(AuditLog.objects.filter(target_id=self.reward.pk).exists())

    def test_duplicate_reference_does_not_change_second_reward(self):
        self.assertEqual(self.payout().status_code, 200)
        other = ReferralReward.objects.create(referrer=self.referrer, referred_user=self.referred)
        result = self.payout(reward_id=str(other.pk))
        self.assertEqual(result.status_code, 400)
        other.refresh_from_db()
        self.assertEqual(other.status, 'pending')

    def test_referral_list_returns_people_and_bank_details_only_to_admin(self):
        response = self.client.get('/api/v1/admin/referral-rewards/')
        row = response.data['results'][0]
        self.assertEqual(row['referrer_name'], 'Ada Example')
        self.assertEqual(row['referred_email'], 'referred@example.com')
        self.assertEqual(row['account_number'], '0123456789')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.referrer)['access'])
        self.assertEqual(self.client.get('/api/v1/admin/referral-rewards/').status_code, 403)
        self.assertEqual(self.payout().status_code, 403)
        self.assertEqual(self.client.get(f'/api/v1/admin/referral-rewards/{self.reward.pk}/history/').status_code, 403)

    def test_admin_upload_is_downloadable_only_by_owner_and_admin(self):
        service = Service.objects.get(slug='change-of-name')
        application = Application.objects.create(user=self.referrer, service=service, reference_no='DELIVERY-123')
        content = b'%PDF-1.4\nDelivery document\n%%EOF'
        result = self.client.post('/api/v1/admin/documents/upload/', {
            'application': str(application.pk), 'doc_type': 'final_document',
            'file': SimpleUploadedFile('final.pdf', content, content_type='application/pdf')}, format='multipart')
        self.assertEqual(result.status_code, 201, result.data)
        self.assertTrue(result.data['is_deliverable'])
        document_id = result.data['id']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.referrer)['access'])
        download = self.client.get(f'/api/v1/documents/{document_id}/content/')
        self.assertEqual(download.status_code, 200)
        self.assertEqual(b''.join(download.streaming_content), content)
        self.assertEqual(self.client.post('/api/v1/admin/documents/upload/', {}, format='multipart').status_code, 403)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.referred)['access'])
        self.assertEqual(self.client.get(f'/api/v1/documents/{document_id}/content/').status_code, 404)

    def test_history_uses_confirmed_destination_when_customer_changes_profile_before_recording(self):
        self.referrer.bank_name = 'New Bank'
        self.referrer.account_number = '8888888888'
        self.referrer.save(update_fields=['bank_name', 'account_number'])
        self.assertEqual(self.payout().status_code, 200)
        event = AuditLog.objects.get(target_id=self.reward.pk)
        self.assertEqual(event.after['bank_name'], 'Example Bank')
        self.assertEqual(event.after['account_number'], '0123456789')
# SIRI.DEV
