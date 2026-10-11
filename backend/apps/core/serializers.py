from decimal import Decimal
from rest_framework import serializers
from apps.applications.models import Application, ChangeOfNameDetails, StatusHistory
from apps.applications.services import ALLOWED_TRANSITIONS
from apps.documents.models import Document
from apps.payments.models import Payment
from .models import AuditLog


class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
    db = serializers.CharField()
    redis = serializers.CharField()


class ChangeOfNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeOfNameDetails
        exclude = ['id', 'application', 'user', 'submission_id']


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistory
        fields = ['status', 'timestamp', 'note']


class ApplicationSerializer(serializers.ModelSerializer):
    can_manage_documents = serializers.SerializerMethodField()

    def get_can_manage_documents(self, obj) -> bool:
        from apps.documents.services import can_manage_application
        return can_manage_application(obj)

    service_name = serializers.CharField(source='service.name', read_only=True)
    change_of_name = ChangeOfNameSerializer(read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)

    payment = serializers.SerializerMethodField()

    def get_payment(self, obj) -> dict:
        from apps.payments.services import payment_domain
        attempts = sorted((p for p in obj.payments.all() if p.gateway_mode in ('', payment_domain())), key=lambda p: p.created_at, reverse=True)
        paid = next((p for p in attempts if p.status == 'success' and p.verified_at), None)
        latest = paid or next(iter(attempts), None)
        return {'amount': str(obj.payment_amount if obj.payment_amount is not None else obj.service.base_price),
                'currency': 'NGN', 'status': 'paid' if paid else 'unpaid',
                'reference': latest.gateway_reference if latest else None}

    class Meta:
        model = Application
        fields = ['id', 'reference_no', 'user', 'service', 'service_name', 'status', 'created_at', 'updated_at',
                  'change_of_name', 'status_history', 'payment', 'can_manage_documents']
        read_only_fields = fields


class AdminApplicationSerializer(ApplicationSerializer):
    customer_name = serializers.CharField(source='user.full_name', read_only=True)
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    allowed_transitions = serializers.SerializerMethodField()

    def get_allowed_transitions(self, obj) -> list[str]:
        return ALLOWED_TRANSITIONS.get(obj.status, [])

    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + ['customer_name', 'customer_email', 'allowed_transitions']
        read_only_fields = fields


class StatusChangeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=list(ALLOWED_TRANSITIONS))
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000, default='')


class DocumentSerializer(serializers.ModelSerializer):
    reference_no = serializers.CharField(source="application.reference_no", read_only=True)
    can_replace = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    def get_can_replace(self, obj) -> bool:
        from apps.documents.services import can_replace_document
        return can_replace_document(obj)

    def get_can_delete(self, obj) -> bool:
        return self.get_can_replace(obj) and obj.doc_type != 'affidavit'

    class Meta:
        model = Document
        # Storage keys and URLs are never exposed before checking ownership.
        fields = ['id', 'application', 'reference_no', 'doc_type', 'is_deliverable', 'uploaded_by', 'created_at', 'updated_at', 'content_sha256', 'original_filename', 'can_replace', 'can_delete']
        read_only_fields = ['id', 'application', 'uploaded_by', 'created_at', 'updated_at', 'content_sha256', 'original_filename']


class PaymentSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=['pending', 'success', 'failed', 'refunded'])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)

    def validate(self, attrs):
        if self.instance and self.instance.gateway_reference and any(
                key in attrs for key in ('amount', 'status')):
            raise serializers.ValidationError('Gateway payment amounts and statuses are managed by verified payment events.')
        return attrs

    class Meta:
        model = Payment
        fields = ['id', 'application', 'user', 'amount', 'provider', 'status', 'gateway_reference', 'created_at', 'updated_at', 'currency', 'verified_at']
        read_only_fields = ['id', 'application', 'user', 'provider', 'gateway_reference', 'created_at', 'updated_at', 'currency', 'verified_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_email', 'action', 'target_type', 'target_id', 'before', 'after', 'created_at']
        read_only_fields = fields

class AdminDocumentUploadSerializer(serializers.Serializer):
    application = serializers.UUIDField()
    doc_type = serializers.CharField(default='final_document', max_length=100)
    file = serializers.FileField()

from apps.payments.models import ReferralReward

class ReferralRewardSerializer(serializers.ModelSerializer):
    referrer_name = serializers.CharField(source='referrer.full_name', read_only=True)
    referrer_email = serializers.EmailField(source='referrer.email', read_only=True)
    referred_name = serializers.CharField(source='referred_user.full_name', read_only=True)
    referred_email = serializers.EmailField(source='referred_user.email', read_only=True)
    referral_code = serializers.CharField(source='referrer.referral_code', read_only=True, allow_null=True)
    bank_name = serializers.CharField(source='referrer.bank_name', read_only=True)
    account_number = serializers.CharField(source='referrer.account_number', read_only=True)
    account_name = serializers.CharField(source='referrer.account_name', read_only=True)

    class Meta:
        model = ReferralReward
        fields = ['id', 'referrer', 'referred_user', 'referrer_name', 'referrer_email', 'referred_name', 'referred_email',
                  'referral_code', 'bank_name', 'account_number', 'account_name', 'amount', 'status',
                  'payment_method', 'disbursed_at', 'gateway_reference', 'created_at']
        read_only_fields = fields

class PaymentBankDetailsSerializer(serializers.Serializer):
    bank_name = serializers.CharField(max_length=255)
    account_number = serializers.CharField(max_length=50)
    account_name = serializers.CharField(max_length=255)


class DisburseRewardSerializer(serializers.Serializer):
    reward_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    payment_reference = serializers.CharField(max_length=100)
    confirmed_paid = serializers.BooleanField()
    bank_details = PaymentBankDetailsSerializer()
    note = serializers.CharField(max_length=1000, required=False, allow_blank=True, default='')

    def validate_confirmed_paid(self, value):
        if not value:
            raise serializers.ValidationError('Confirm that the manual payment has already been completed.')
        return value
# SIRI.DEV
