from unittest.mock import patch
from django.test import override_settings
from django.db import transaction
from django.utils import timezone
from rest_framework.test import APITestCase
from kombu.exceptions import OperationalError
from apps.accounts.models import User
from apps.accounts.services import create_session_tokens
from apps.applications.models import Application, StatusHistory
from apps.applications.services import transition_status
from apps.services.models import Service
from apps.payments.models import Payment
from apps.documents.models import Document
from .models import Notification
from .delivery import decode_payload
from .test_delivery import SETTINGS


@override_settings(**SETTINGS)
class TriggerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='ada@example.com', full_name='Ada Example', password='SecurePassword123!')
        self.service = Service.objects.get(slug='change-of-name')
        self.app = Application.objects.create(user=self.user, service=self.service, reference_no='NA-123')

    def test_signup_creates_two_notifications_and_broker_failure_does_not_break_signup(self):
        with patch('apps.notifications.tasks.deliver_notification.apply_async', side_effect=OperationalError()), self.captureOnCommitCallbacks(execute=True):
            response = self.client.post('/api/v1/auth/signup/', {'email': 'new@example.com', 'full_name': 'New User', 'password': 'SecurePassword123!'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertCountEqual(Notification.objects.values_list('type', flat=True), ['welcome', 'verification'])
        self.assertEqual(Notification.objects.filter(state='pending').count(), 2)

    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_google_welcome_only_for_new_account(self, verify):
        verify.return_value = {'email': 'google@example.com', 'sub': 'google-123', 'name': 'Google User'}
        for _ in range(2):
            self.assertEqual(self.client.post('/api/v1/auth/google/', {'id_token': 'token'}, format='json').status_code, 200)
        self.assertEqual(list(Notification.objects.values_list('type', flat=True)), ['welcome'])

    def test_completion_uses_one_completion_email_and_excludes_internal_note(self):
        admin = User.objects.create_user(email='admin@example.com', role='admin')
        self.app.status = 'final_documentation'
        self.app.save()
        Document.objects.create(application=self.app, doc_type='final_document', file='final.pdf', is_deliverable=True)
        transition_status(self.app, 'completed', admin, note='PRIVATE ADMIN NOTE')
        message = Notification.objects.get()
        self.assertEqual(message.type, 'request_completed')
        self.assertNotIn('PRIVATE ADMIN NOTE', decode_payload(message.payload)['html'])

    def test_rollback_does_not_leave_email(self):
        from .services import notify_application_received
        with self.assertRaises(ValueError):
            with transaction.atomic():
                notify_application_received(self.app)
                raise ValueError('rollback')
        self.assertFalse(Notification.objects.exists())

    def test_application_and_payment_events_deduplicate(self):
        from .services import notify_application_received, notify_payment_confirmed
        payment = Payment.objects.create(application=self.app, user=self.user, amount=5000, currency='NGN',
            status='success', verified_at=timezone.now(), gateway_reference='PAY-123')
        for _ in range(2):
            notify_application_received(self.app)
            notify_payment_confirmed(payment)
        self.assertCountEqual(Notification.objects.values_list('type', flat=True), ['request_received', 'payment_confirmation'])
        self.assertIn('NGN 5,000.00', decode_payload(Notification.objects.get(type='payment_confirmation').payload)['text'])

    def test_reset_and_verify_work_with_stale_auth_and_do_not_reveal_unknown_email(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer expired')
        known = self.client.post('/api/v1/auth/password-reset/', {'email': self.user.email}, format='json')
        unknown = self.client.post('/api/v1/auth/password-reset/', {'email': 'unknown@example.com'}, format='json')
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(Notification.objects.filter(type='password_reset').count(), 1)

    def test_resend_is_throttled_and_verified_accounts_do_not_send(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.user)['access'])
        url = '/api/v1/auth/verify-email/resend/'
        self.assertEqual(self.client.post(url).status_code, 200)
        for _ in range(2): self.client.post(url)
        self.assertEqual(self.client.post(url).status_code, 429)

    def test_verified_account_resend_is_noop(self):
        self.user.email_verified = True
        self.user.save(update_fields=['email_verified'])
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + create_session_tokens(self.user)['access'])
        self.assertEqual(self.client.post('/api/v1/auth/verify-email/resend/').status_code, 200)
        self.assertFalse(Notification.objects.exists())

    def test_reset_rejects_non_object_payload(self):
        response = self.client.post('/api/v1/auth/password-reset/', [], format='json')
        self.assertEqual(response.status_code, 400)

    @override_settings(FRONTEND_URL='https://nameassist.vercel.app/subpath')
    def test_invalid_email_url_does_not_break_signup_or_disclose_reset_account(self):
        result = self.client.post('/api/v1/auth/signup/', {
            'email': 'config@example.com', 'full_name': 'Config Test', 'password': 'SecurePassword123!'
        }, format='json')
        self.assertEqual(result.status_code, 201)
        self.assertEqual(Notification.objects.filter(state='failed').count(), 2)
        known = self.client.post('/api/v1/auth/password-reset/', {'email': self.user.email}, format='json')
        unknown = self.client.post('/api/v1/auth/password-reset/', {'email': 'unknown@example.com'}, format='json')
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
# SIRI.DEV
