import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import Mock, patch

import requests
from django.test import override_settings
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.applications.models import Application
from apps.services.models import Service
from .models import Payment
from .services import verify_payment, GatewayUnavailable


@override_settings(PAYSTACK_SECRET_KEY='sk_test_security_fixture', PAYSTACK_CALLBACK_URL='http://localhost:3000/?payment=return')
class PaymentSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='owner@example.com', full_name='Owner')
        self.other = User.objects.create_user(email='other@example.com', full_name='Other')
        self.service = Service.objects.create(name='Test service', base_price=Decimal('100.01'), internal_cost=0)
        self.application = Application.objects.create(user=self.user, service=self.service, reference_no='PAY-APP-1')
        self.client.force_authenticate(self.user)

    def payment(self, **kwargs):
        return Payment.objects.create(application=self.application, user=self.user, amount='100.01',
                                      gateway_reference='NA-PAY-test', gateway_mode=kwargs.pop('gateway_mode', 'test'), **kwargs)

    def verified_data(self, **changes):
        data = {'status': 'success', 'reference': 'NA-PAY-test', 'amount': 10001, 'currency': 'NGN',
                'customer': {'email': self.user.email}, 'metadata': {'user_id': str(self.user.id), 'application_id': str(self.application.id)},
                'domain': 'test'}
        data.update(changes)
        return {'status': True, 'data': data}

    def gateway(self, payload):
        response = Mock()
        response.json.return_value = payload
        return response

    def initialize(self, **extra):
        return self.client.post('/api/v1/payments/initialize/', {'application_id': str(self.application.id), **extra}, format='json')

    def fake_initialize(self, url, **kwargs):
        payload = kwargs['json']
        return self.gateway({'status': True, 'data': {'reference': payload['reference'],
                                                      'authorization_url': 'https://checkout.paystack.com/test-checkout'}})

    def signed_webhook(self, payload, secret=b'sk_test_security_fixture'):
        raw = json.dumps(payload)
        signature = hmac.new(secret, raw.encode(), hashlib.sha512).hexdigest()
        self.client.force_authenticate(None)
        return self.client.post('/api/v1/payments/webhook/paystack/', raw, content_type='application/json',
                                HTTP_X_PAYSTACK_SIGNATURE=signature)

    @patch('apps.payments.services.requests.get')
    def test_mismatched_amount_cannot_mark_application_paid(self, get):
        payment = self.payment()
        get.return_value = self.gateway(self.verified_data(amount=1))
        with self.assertRaises(GatewayUnavailable):
            verify_payment(payment.gateway_reference)
        payment.refresh_from_db()
        self.assertNotEqual(payment.status, 'success')
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'received')

    @patch('apps.payments.services.requests.post')
    def test_initialize_uses_exact_server_amount_and_reuses_pending_checkout(self, post):
        post.side_effect = self.fake_initialize
        first = self.initialize(amount=1, currency='USD', callback_url='https://attacker.example')
        second = self.initialize()
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(first.data['reference'], second.data['reference'])
        self.assertEqual(Payment.objects.count(), 1)
        sent = post.call_args.kwargs
        self.assertEqual(sent['json']['amount'], 10001)
        self.assertEqual(sent['json']['currency'], 'NGN')
        self.assertEqual(sent['json']['callback_url'], 'http://localhost:3000/?payment=return')
        self.assertIn('timeout', sent)

    def test_initialize_ownership_and_malformed_id(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.initialize().status_code, 404)
        self.assertEqual(self.client.post('/api/v1/payments/initialize/', {'application_id': 'bad'}, format='json').status_code, 400)

    @patch('apps.payments.services.requests.get', side_effect=requests.Timeout)
    def test_webhook_failure_is_retryable(self, get):
        self.payment()
        response = self.signed_webhook({'event': 'charge.success', 'data': {'reference': 'NA-PAY-test'}})
        self.assertEqual(response.status_code, 503)

    @override_settings(PAYSTACK_SECRET_KEY='')
    def test_missing_webhook_key_fails_closed(self):
        response = self.signed_webhook({'event': 'charge.success', 'data': {'reference': 'NA-PAY-test'}}, secret=b'')
        self.assertEqual(response.status_code, 503)

    @patch('apps.payments.services.requests.get')
    def test_success_is_verified_once_and_keeps_document_review_workflow(self, get):
        payment = self.payment(status='failed')
        get.return_value = self.gateway(self.verified_data())
        first = self.client.post('/api/v1/payments/verify/', {'reference': payment.gateway_reference}, format='json')
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data['status'], 'success')
        self.assertIsNotNone(first.data['verified_at'])
        response = self.signed_webhook({'event': 'charge.success', 'data': {'reference': payment.gateway_reference}})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(get.call_count, 1)
        self.assertEqual(self.application.status_history.count(), 1)
        from apps.notifications.models import Notification
        self.assertEqual(Notification.objects.filter(type='payment_confirmation').count(), 1)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'received')
        self.client.force_authenticate(self.user)
        with patch('apps.payments.services.requests.post') as post:
            result = self.initialize()
            self.assertTrue(result.data['paid'])
            self.assertIsNone(result.data['authorization_url'])
            post.assert_not_called()

    @patch('apps.payments.services.requests.get')
    def test_every_success_binding_is_checked(self, get):
        payment = self.payment()
        for changes in ({'currency': 'USD'}, {'reference': 'other'}, {'amount': True}, {'domain': 'live'},
                        {'customer': {'email': self.other.email}}, {'metadata': {}}, {'customer': None}):
            with self.subTest(changes=changes):
                get.return_value = self.gateway(self.verified_data(**changes))
                response = self.client.post('/api/v1/payments/verify/', {'reference': payment.gateway_reference}, format='json')
                self.assertEqual(response.status_code, 503)
                payment.refresh_from_db()
                self.assertIsNone(payment.verified_at)
        self.assertEqual(self.application.status_history.count(), 0)

    @patch('apps.payments.services.requests.get')
    def test_verification_requires_owner_before_contacting_gateway(self, get):
        payment = self.payment()
        self.client.force_authenticate(self.other)
        response = self.client.post('/api/v1/payments/verify/', {'reference': payment.gateway_reference}, format='json')
        self.assertEqual(response.status_code, 404)
        get.assert_not_called()
        self.client.force_authenticate(None)
        self.assertEqual(self.initialize().status_code, 401)

    @patch('apps.payments.services.requests.post')
    def test_quote_remains_stable_when_service_price_changes(self, post):
        self.application.payment_amount = Decimal('88.99')
        self.application.save()
        post.side_effect = self.fake_initialize
        self.assertEqual(self.initialize().status_code, 200)
        self.assertEqual(post.call_args.kwargs['json']['amount'], 8899)
        self.service.base_price = Decimal('200.00')
        self.service.save()
        response = self.client.get(f'/api/v1/applications/{self.application.pk}/')
        self.assertEqual(response.data['payment']['amount'], '88.99')

    @patch('apps.payments.services.requests.post')
    def test_initializing_attempt_prevents_another_checkout(self, post):
        self.payment(status='initializing')
        self.assertEqual(self.initialize().status_code, 409)
        post.assert_not_called()

    @patch('apps.payments.services.requests.post', side_effect=requests.Timeout)
    def test_initialize_timeout_saves_application_and_reservation(self, post):
        self.assertEqual(self.initialize().status_code, 503)
        self.assertEqual(Application.objects.count(), 1)
        self.assertEqual(Payment.objects.get().status, 'initialization_failed')

    @patch('apps.payments.services.requests.post')
    def test_gateway_cannot_redirect_customer_elsewhere(self, post):
        def response(url, **kwargs):
            return self.gateway({'status': True, 'data': {'reference': kwargs['json']['reference'],
                'authorization_url': 'https://checkout.paystack.com.attacker.example/steal'}})
        post.side_effect = response
        self.assertEqual(self.initialize().status_code, 503)
        self.assertEqual(Payment.objects.get().checkout_url, '')

    def test_gateway_fields_cannot_be_forged_by_admin_serializer(self):
        from apps.core.serializers import PaymentSerializer
        payment = self.payment()
        serializer = PaymentSerializer(payment, data={'status': 'success', 'amount': '0.01'}, partial=True)
        self.assertFalse(serializer.is_valid())
        serializer = PaymentSerializer(payment, data={'verified_at': '2026-09-20T00:00:00Z'}, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.assertIsNone(payment.verified_at)

    def test_unpaid_quoted_application_cannot_advance(self):
        from apps.applications.services import transition_status
        self.application.payment_amount = Decimal('100.01')
        self.application.save()
        with self.assertRaisesMessage(ValueError, 'Payment must be confirmed'):
            transition_status(self.application, 'document_review', self.user)

    def test_signed_malformed_webhook_is_rejected(self):
        self.assertEqual(self.signed_webhook([]).status_code, 400)
        self.assertEqual(self.signed_webhook({'event': 'charge.success', 'data': []}).status_code, 400)

    @patch('apps.payments.services.requests.post')
    @patch('apps.payments.services.requests.get')
    def test_legacy_success_is_reverified_before_new_checkout(self, get, post):
        self.payment(status='success', gateway_mode='')
        get.return_value = self.gateway(self.verified_data())
        self.service.base_price = Decimal('200.00')
        self.service.save()
        response = self.initialize()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['paid'])
        post.assert_not_called()
        self.application.refresh_from_db()
        self.assertEqual(self.application.payment_amount, Decimal('100.01'))

    @patch('apps.payments.services.requests.post')
    @patch('apps.payments.services.requests.get')
    def test_legacy_pending_checkout_does_not_create_second_charge(self, get, post):
        self.payment(status='pending', gateway_mode='')
        get.return_value = self.gateway(self.verified_data(status='pending'))
        self.assertEqual(self.initialize().status_code, 409)
        post.assert_not_called()
        self.assertEqual(Payment.objects.count(), 1)

    @patch('apps.payments.services.requests.post')
    @patch('apps.payments.services.requests.get')
    def test_test_mode_payment_cannot_pay_for_live_application(self, get, post):
        from apps.core.serializers import ApplicationSerializer
        self.payment()
        get.return_value = self.gateway(self.verified_data())
        verify_payment('NA-PAY-test')
        with override_settings(PAYSTACK_SECRET_KEY='sk_live_security_fixture'):
            self.assertEqual(ApplicationSerializer(self.application).data['payment']['status'], 'unpaid')
            post.side_effect = self.fake_initialize
            response = self.initialize()
            self.assertEqual(response.status_code, 200)
            self.assertFalse(response.data['paid'])
            self.assertEqual(Payment.objects.filter(gateway_mode='live').count(), 1)

    def test_admin_noop_write_cannot_race_payment_confirmation(self):
        from apps.core.serializers import PaymentSerializer
        payment = self.payment()
        self.assertFalse(PaymentSerializer(payment, data={'status': 'pending'}, partial=True).is_valid())

    @patch('apps.payments.services.requests.post')
    @patch('apps.payments.services.requests.get')
    def test_multiple_legacy_attempts_are_all_reconciled_before_replacement(self, get, post):
        self.payment(status='pending', gateway_mode='')
        second = Payment.objects.create(application=self.application, user=self.user, amount='100.01',
            gateway_reference='NA-PAY-second', gateway_mode='', status='success')
        def verify(url, **kwargs):
            reference = url.rsplit('/', 1)[-1]
            return self.gateway(self.verified_data(reference=reference,
                status='success' if reference == second.gateway_reference else 'failed'))
        get.side_effect = verify
        self.assertTrue(self.initialize().data['paid'])
        post.assert_not_called()

    @patch('apps.payments.services.requests.post')
    @patch('apps.payments.services.requests.get')
    def test_legacy_success_flag_does_not_bypass_pending_gateway_state(self, get, post):
        self.payment(status='success', gateway_mode='')
        get.return_value = self.gateway(self.verified_data(status='ongoing'))
        self.assertEqual(self.initialize().status_code, 409)
        post.assert_not_called()

    @patch('apps.payments.services.requests.get')
    def test_success_webhook_retries_until_gateway_verification_is_confirmed(self, get):
        self.payment()
        get.return_value = self.gateway(self.verified_data(status='pending'))
        response = self.signed_webhook({'event': 'charge.success', 'data': {'reference': 'NA-PAY-test'}})
        self.assertEqual(response.status_code, 503)

    @patch('apps.payments.services.requests.get')
    @patch('apps.payments.services.requests.post')
    def test_verification_during_initialization_does_not_release_reservation(self, post, get):
        def initialize(url, **kwargs):
            reference = kwargs['json']['reference']
            get.return_value = self.gateway(self.verified_data(reference=reference, status='pending'))
            verify_payment(reference)
            self.assertEqual(self.initialize().status_code, 409)
            return self.fake_initialize(url, **kwargs)
        post.side_effect = initialize
        self.assertEqual(self.initialize().status_code, 200)
        self.assertEqual(Payment.objects.count(), 1)

    @patch('apps.payments.services.requests.get')
    def test_non_success_response_must_also_match_reference(self, get):
        payment = self.payment()
        get.return_value = self.gateway(self.verified_data(reference='unrelated', status='failed'))
        with self.assertRaises(GatewayUnavailable):
            verify_payment(payment.gateway_reference)
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'pending')
# SIRI.DEV
