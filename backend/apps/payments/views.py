import hashlib
import hmac
import re
from django.conf import settings
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.applications.models import Application
from apps.core.serializers import PaymentSerializer
from .models import Payment
from .services import initialize_payment, verify_payment, GatewayUnavailable


class InitializeInput(serializers.Serializer):
    application_id = serializers.UUIDField()


class InitializeResult(serializers.Serializer):
    authorization_url = serializers.URLField(allow_null=True)
    reference = serializers.CharField()
    paid = serializers.BooleanField()


class VerifyInput(serializers.Serializer):
    reference = serializers.RegexField(r'^[A-Za-z0-9_.=-]{1,100}$')


class InitializePaymentView(APIView):
    serializer_class = InitializeInput
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=InitializeResult)
    def post(self, request):
        data = InitializeInput(data=request.data)
        data.is_valid(raise_exception=True)
        application = get_object_or_404(Application, pk=data.validated_data['application_id'], user=request.user)
        url, reference = initialize_payment(application, request.user)
        return Response({'authorization_url': url, 'reference': reference, 'paid': url is None})


class VerifyPaymentView(APIView):
    serializer_class = VerifyInput
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=PaymentSerializer)
    def post(self, request):
        data = VerifyInput(data=request.data)
        data.is_valid(raise_exception=True)
        reference = data.validated_data['reference']
        get_object_or_404(Payment, gateway_reference=reference, user=request.user)
        return Response(PaymentSerializer(verify_payment(reference)).data)


@extend_schema(exclude=True)
class PaystackWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not settings.PAYSTACK_SECRET_KEY:
            raise GatewayUnavailable()
        signature = request.headers.get('x-paystack-signature', '')
        expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), request.body, hashlib.sha512).hexdigest()
        if not re.fullmatch(r'[a-fA-F0-9]{128}', signature) or not hmac.compare_digest(signature.lower(), expected):
            return Response(status=400)
        payload = request.data
        if not isinstance(payload, dict):
            return Response(status=400)
        if payload.get('event') == 'charge.success':
            data = payload.get('data')
            reference = data.get('reference') if isinstance(data, dict) else None
            if not isinstance(reference, str) or not re.fullmatch(r'[A-Za-z0-9_.=-]{1,100}', reference):
                return Response(status=400)
            # A Paystack account may also receive transactions from other applications.
            if Payment.objects.filter(gateway_reference=reference).exists():
                payment = verify_payment(reference)
                if not (payment.status == 'success' and payment.verified_at) and payment.status != 'refunded':
                    raise GatewayUnavailable()  # Do not acknowledge an unreconciled success event.
        return Response(status=200)
# SIRI.DEV
