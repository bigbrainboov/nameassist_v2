import hmac
import hashlib
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.applications.models import Application
from apps.services.models import Service
from .models import Payment
from .services import initialize_payment, verify_payment

User = get_user_model()

@override_settings(PAYSTACK_SECRET_KEY='sk_test_mocked_key')
class TestPaymentServices(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="password123")
        self.service = Service.objects.create(name="Change of Name", slug=f"change-of-name-{id(self)}", base_price=100.00, internal_cost=50.00)
        self.application = Application.objects.create(
            reference_no="REF-12345",
            user=self.user,
            service=self.service,
            status='received'
        )

    @patch('apps.payments.services.requests.post')
    def test_initialize_payment_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": True,
            "data": {
                "authorization_url": "https://checkout.paystack.com/mock",
                "reference": "mock_reference_123"
            }
        }
        def initialize_response(*args, **kwargs):
            mock_response.json.return_value['data']['reference'] = kwargs['json']['reference']
            return mock_response
        mock_post.side_effect = initialize_response

        auth_url, reference = initialize_payment(self.application, self.user, 100.00)

        self.assertEqual(auth_url, "https://checkout.paystack.com/mock")
        self.assertTrue(reference.startswith("NA-PAY-"))

        payment = Payment.objects.get(gateway_reference=reference)
        self.assertEqual(payment.status, "pending")
        self.assertEqual(payment.amount, 100.00)

    @patch('apps.payments.services.requests.get')
    def test_verify_payment_success(self, mock_get):
        payment = Payment.objects.create(
            application=self.application,
            user=self.user,
            amount=100.00,
            status='pending',
            gateway_reference='mock_reference_123'
        )

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": True,
            "data": {
                "status": "success",
                "reference": "mock_reference_123", "amount": 10000, "currency": "NGN",
                "customer": {"email": self.user.email}, "domain": "test",
                "metadata": {"application_id": str(self.application.pk), "user_id": str(self.user.pk)}
            }
        }
        mock_get.return_value = mock_response

        updated_payment = verify_payment('mock_reference_123')

        self.assertEqual(updated_payment.status, "success")

        self.application.refresh_from_db()
        self.assertEqual(self.application.status, "received")
        self.assertIsNotNone(updated_payment.verified_at)


@override_settings(PAYSTACK_SECRET_KEY='sk_test_mocked_key')
class TestPaymentAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="test@example.com", password="password123")
        self.client.force_authenticate(user=self.user)
        self.service = Service.objects.create(name="Change of Name", slug=f"change-of-name-{id(self)}", base_price=100.00, internal_cost=50.00)
        self.application = Application.objects.create(
            reference_no="REF-67890",
            user=self.user,
            service=self.service,
            status='received'
        )

    @patch('apps.payments.views.initialize_payment')
    def test_initialize_payment_view(self, mock_initialize):
        mock_initialize.return_value = ("https://checkout.paystack.com/mock", "mock_ref")

        url = reverse('payment-initialize')
        response = self.client.post(url, {
            "application_id": str(self.application.id)

        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['authorization_url'], "https://checkout.paystack.com/mock")


    @patch('apps.payments.services.requests.get')
    def test_paystack_webhook_success(self, mock_get):
        Payment.objects.create(application=self.application, user=self.user, amount=100, gateway_reference='mock_reference_123')
        url = reverse('payment-webhook')
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "mock_reference_123"
            }
        }
        payload_str = json.dumps(payload)
        payload_bytes = payload_str.encode('utf-8')

        response = MagicMock()
        response.json.return_value = {'status': True, 'data': {
            'status': 'success', 'reference': 'mock_reference_123', 'amount': 10000, 'currency': 'NGN',
            'domain': 'test', 'customer': {'email': self.user.email},
            'metadata': {'application_id': str(self.application.pk), 'user_id': str(self.user.pk)}}}
        mock_get.return_value = response

        secret = b'sk_test_mocked_key'
        signature = hmac.new(secret, payload_bytes, hashlib.sha512).hexdigest()

        self.client.force_authenticate(user=None)
        response = self.client.post(url, payload_str, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(Payment.objects.get(gateway_reference='mock_reference_123').verified_at)


    def test_paystack_webhook_invalid_signature(self):
        Payment.objects.create(application=self.application, user=self.user, amount=100, gateway_reference='mock_reference_123')
        url = reverse('payment-webhook')
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "mock_reference_123"
            }
        }

        self.client.force_authenticate(user=None)
        response = self.client.post(url, payload, format='json', HTTP_X_PAYSTACK_SIGNATURE="invalid_signature")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
# SIRI.DEV
