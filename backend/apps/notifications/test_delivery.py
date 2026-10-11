from datetime import timedelta
from unittest.mock import patch, Mock
from django.test import TestCase, SimpleTestCase, override_settings
from django.utils import timezone
from apps.accounts.models import User
from .delivery import enqueue_email, decode_payload
from .tasks import deliver_notification, recover_pending_notifications
from .provider import send_resend, RetryableEmailError, PermanentEmailError

SETTINGS = dict(EMAIL_DELIVERY_MODE='resend', EMAIL_PAYLOAD_ENCRYPTION_KEY='test-only-encryption-key-at-least-32',
    RESEND_API_KEY='test-key', DEFAULT_FROM_EMAIL='NameAssist <nameassist@thisbookiyanga.com>',
    EMAIL_REPLY_TO='', FRONTEND_URL='https://nameassist.vercel.app')


@override_settings(**SETTINGS)
class DeliveryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='ada@example.com', full_name='Ada')

    def queue(self, **kwargs):
        return enqueue_email(kind='welcome', user=self.user, context={}, event_key='welcome/1', **kwargs)

    def test_dedup_and_acceptance(self):
        record = self.queue()
        self.assertEqual(self.queue().pk, record.pk)
        with patch('apps.notifications.tasks.send_resend', return_value='provider-123') as provider:
            deliver_notification(str(record.pk))
            deliver_notification(str(record.pk))
        record.refresh_from_db()
        self.assertEqual(record.state, 'sent')
        self.assertEqual(record.provider_message_id, 'provider-123')
        self.assertIsNotNone(record.sent_at)
        self.assertEqual(provider.call_count, 1)

    def test_retry_retains_payload_key_and_never_marks_failed_attempt_sent(self):
        record = self.queue()
        with patch('apps.notifications.tasks.send_resend', side_effect=RetryableEmailError('timeout')) as provider:
            deliver_notification(str(record.pk))
            first_call = provider.call_args
        record.refresh_from_db()
        self.assertIsNone(record.sent_at)
        self.assertEqual(record.state, 'pending')
        type(record).objects.filter(pk=record.pk).update(next_attempt_at=timezone.now())
        with patch('apps.notifications.tasks.send_resend', return_value='accepted') as provider:
            deliver_notification(str(record.pk))
            self.assertEqual(first_call, provider.call_args)

    def test_expired_security_message_and_ambiguous_old_send_not_sent(self):
        record = self.queue(expires_at=timezone.now() - timedelta(seconds=1))
        with patch('apps.notifications.tasks.send_resend') as provider:
            deliver_notification(str(record.pk))
            provider.assert_not_called()
        record.refresh_from_db()
        self.assertEqual(record.state, 'expired')
        type(record).objects.filter(pk=record.pk).update(state='pending', expires_at=None,
            first_attempt_at=timezone.now() - timedelta(hours=24))
        deliver_notification(str(record.pk))
        record.refresh_from_db()
        self.assertEqual(record.state, 'review')

    def test_security_payload_is_encrypted(self):
        record = enqueue_email(kind='password_reset', user=self.user,
            context={'action_url': 'https://nameassist.vercel.app/#/reset-password?token=secret-token'}, event_key='reset/1')
        self.assertNotIn('secret-token', record.payload)
        self.assertIn('secret-token', decode_payload(record.payload)['html'])

    def test_live_lease_prevents_duplicate_and_expired_lease_recovers(self):
        record = self.queue()
        type(record).objects.filter(pk=record.pk).update(state='sending', lease_at=timezone.now())
        with patch('apps.notifications.tasks.send_resend') as provider:
            deliver_notification(str(record.pk))
            provider.assert_not_called()
        type(record).objects.filter(pk=record.pk).update(lease_at=timezone.now() - timedelta(minutes=6))
        with patch('apps.notifications.tasks.send_resend', return_value='recovered'):
            deliver_notification(str(record.pk))
        record.refresh_from_db()
        self.assertEqual(record.state, 'sent')

    @override_settings(EMAIL_PAYLOAD_ENCRYPTION_KEY='')
    def test_missing_key_creates_failed_record_without_plaintext(self):
        record = self.queue()
        self.assertEqual(record.state, 'failed')
        self.assertEqual(record.payload, '')
        self.assertIsNone(record.sent_at)

    def test_recovery_dispatches_only_due_pending_and_expired_leases(self):
        record = self.queue()
        with patch('apps.notifications.tasks.dispatch_notification') as dispatch:
            recover_pending_notifications()
            self.assertEqual(dispatch.call_args.args, (record.pk,))
        type(record).objects.filter(pk=record.pk).update(state='sent')
        with patch('apps.notifications.tasks.dispatch_notification') as dispatch:
            recover_pending_notifications()
            dispatch.assert_not_called()

    def test_missing_api_key_and_permanent_provider_failure_never_mark_sent(self):
        with override_settings(RESEND_API_KEY=''):
            record = self.queue()
        self.assertEqual(record.state, 'failed')
        record.delete()
        record = self.queue()
        with patch('apps.notifications.tasks.send_resend', side_effect=PermanentEmailError('provider_http_403')):
            deliver_notification(str(record.pk))
        record.refresh_from_db()
        self.assertEqual(record.state, 'failed')
        self.assertIsNone(record.sent_at)

    @override_settings(EMAIL_DELIVERY_MODE='preview')
    def test_preview_never_sends_or_claims_success(self):
        record = self.queue()
        with patch('apps.notifications.tasks.send_resend') as provider:
            deliver_notification(str(record.pk))
            provider.assert_not_called()
        record.refresh_from_db()
        self.assertIsNone(record.sent_at)
        self.assertEqual(record.state, 'preview')


@override_settings(**SETTINGS)
class ProviderTests(SimpleTestCase):
    @patch('apps.notifications.provider.requests.post')
    def test_http_contract(self, post):
        post.return_value = Mock(status_code=200, headers={}, json=lambda: {'id': 'sent-123'})
        self.assertEqual(send_resend({'to': ['ada@example.com'], 'html': 'hello'}, 'stable-key'), 'sent-123')
        self.assertEqual(post.call_args.kwargs['headers']['Idempotency-Key'], 'stable-key')
        self.assertEqual(post.call_args.kwargs['timeout'], (3, 12))
        self.assertFalse(post.call_args.kwargs['allow_redirects'])

    @patch('apps.notifications.provider.requests.post')
    def test_status_classification(self, post):
        for status in (429, 500, 503):
            post.return_value = Mock(status_code=status, headers={'Retry-After': '60'})
            with self.assertRaises(RetryableEmailError): send_resend({}, 'key')
        for status in (400, 401, 403, 422):
            post.return_value = Mock(status_code=status, headers={})
            with self.assertRaises(PermanentEmailError): send_resend({}, 'key')
        post.return_value = Mock(status_code=200, headers={}, json=lambda: {})
        with self.assertRaises(RetryableEmailError): send_resend({}, 'key')
# SIRI.DEV
