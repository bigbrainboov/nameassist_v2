from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.http import FileResponse
from django.core.files.storage import FileSystemStorage
from pathlib import Path
import redis
from django.conf import settings
from django.db import transaction
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.accounts.services import IsAdminSession
from apps.applications.models import Application
from apps.applications.services import transition_status
from apps.documents.models import Document
from apps.documents.views import CustomerDocumentMutationMixin
from apps.payments.models import Payment
from .models import AuditLog
from apps.documents.services import admin_upload_document
from .serializers import AdminDocumentUploadSerializer
from apps.payments.models import ReferralReward
from .serializers import ReferralRewardSerializer, DisburseRewardSerializer
from apps.payments.services import disburse_referral_reward
from .serializers import (ApplicationSerializer, AdminApplicationSerializer, DocumentSerializer, PaymentSerializer,
                          StatusChangeSerializer, AuditLogSerializer, HealthCheckSerializer)
from .services import record_admin_change
from drf_spectacular.utils import extend_schema

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    @extend_schema(responses=HealthCheckSerializer)
    def get(self, request):
        db_status = "ok"
        try:
            connection.ensure_connection()
        except Exception:
            db_status = "failed"

        redis_status = "ok"
        try:
            r = redis.from_url(settings.CELERY_BROKER_URL)
            r.ping()
        except Exception:
            redis_status = "failed"

        return Response(
            {"status": "ok", "db": db_status, "redis": redis_status},
            status=status.HTTP_200_OK if db_status == "ok" and redis_status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE
        )


class OperationsPagination(PageNumberPagination):
    page_size = 50


class CustomerApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationSerializer
    pagination_class = OperationsPagination
    queryset = Application.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        return Application.objects.filter(user=self.request.user).select_related('service', 'change_of_name').prefetch_related('status_history', 'payments').order_by('-created_at', '-id')


class DocumentReadViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    pagination_class = OperationsPagination
    queryset = Document.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        return Document.objects.filter(application__user=self.request.user).select_related('application__service').order_by('-created_at', '-id')

    @extend_schema(responses={200: {'type': 'object', 'properties': {'url': {'type': 'string', 'format': 'uri'}}}})
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        if not document.file:
            raise ValidationError('This document has no file.')
        if isinstance(document.file.storage, FileSystemStorage):
            response = Response({'url': request.build_absolute_uri(request.path.replace('/download/', '/content/'))})
            response['Cache-Control'] = 'no-store'
            return response
        response = Response({'url': document.file.url})
        response['Cache-Control'] = 'no-store'
        return response


    @action(detail=True, methods=['get'])
    def content(self, request, pk=None):
        document = self.get_object()
        if not document.file:
            raise ValidationError('This document has no file.')
        try:
            file = document.file.open('rb')
        except FileNotFoundError:
            from rest_framework.exceptions import NotFound
            raise NotFound('This file is no longer available.')
        response = FileResponse(file, as_attachment=True,
                                filename=f'{document.doc_type}{Path(document.file.name).suffix}')
        response['Cache-Control'] = 'no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        return response


class CustomerDocumentViewSet(CustomerDocumentMutationMixin, DocumentReadViewSet):
    pass


class CustomerPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer
    pagination_class = OperationsPagination
    queryset = Payment.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        return Payment.objects.filter(user=self.request.user, application__user=self.request.user).order_by('-created_at', '-id')


class AdminApplicationViewSet(CustomerApplicationViewSet):
    permission_classes = [IsAdminSession]
    serializer_class = AdminApplicationSerializer

    def get_queryset(self):
        queryset = Application.objects.select_related('user', 'service', 'change_of_name').prefetch_related('payments', 'status_history')
        if self.request.query_params.get('payment_status') == 'paid':
            from django.db.models import Exists, OuterRef
            from apps.payments.services import payment_domain
            confirmed = Payment.objects.filter(application_id=OuterRef('pk'), user_id=OuterRef('user_id'),
                status='success', verified_at__isnull=False, gateway_mode=payment_domain())
            queryset = queryset.filter(Exists(confirmed))
        return queryset.order_by('-created_at', '-id')

    @extend_schema(responses=AdminApplicationSerializer)
    @action(detail=True, methods=['post'], serializer_class=StatusChangeSerializer)
    def status(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            application = transition_status(self.get_object(), serializer.validated_data['status'],
                                            request.user, serializer.validated_data['note'])
        except ValueError as exc:
            raise ValidationError({'status': str(exc)})
        return Response(AdminApplicationSerializer(application).data)


class AuditedUpdateMixin(mixins.UpdateModelMixin):
    audit_fields = ()

    def perform_update(self, serializer):
        with transaction.atomic():
            instance = type(serializer.instance).objects.select_for_update().get(pk=serializer.instance.pk)
            serializer.instance = instance
            before = {field: str(getattr(instance, field)) if field == 'amount' else getattr(instance, field)
                      for field in self.audit_fields}
            instance = serializer.save()
            after = {field: str(getattr(instance, field)) if field == 'amount' else getattr(instance, field)
                     for field in self.audit_fields}
            if before != after:
                record_admin_change(self.request.user, instance, 'update', before, after)


class AdminDocumentViewSet(AuditedUpdateMixin, DocumentReadViewSet):
    permission_classes = [IsAdminSession]
    audit_fields = ('doc_type', 'is_deliverable')

    def get_queryset(self):
        queryset = Document.objects.select_related('application__service').all()
        application = self.request.query_params.get('application')
        if application:
            from rest_framework.fields import UUIDField
            queryset = queryset.filter(application_id=UUIDField().run_validation(application))
        return queryset.order_by('-created_at', '-id')
        
    @extend_schema(request=AdminDocumentUploadSerializer, responses={201: DocumentSerializer})
    @action(detail=False, methods=['post'])
    def upload(self, request):
        if set(request.FILES) - {'file'} or len(request.FILES.getlist('file')) > 1:
            raise ValidationError('Upload one file per request.')
            
        serializer = AdminDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        document = admin_upload_document(
            admin_user=request.user,
            application_id=data['application'],
            upload=data['file'],
            doc_type=data.get('doc_type', 'final_document')
        )
        return Response(self.get_serializer(document).data, status=status.HTTP_201_CREATED)



class AdminPaymentViewSet(AuditedUpdateMixin, CustomerPaymentViewSet):
    permission_classes = [IsAdminSession]
    audit_fields = ('status', 'amount')

    def get_queryset(self):
        return Payment.objects.all().order_by('-created_at', '-id')


class AdminCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminSession]
    serializer_class = UserSerializer
    pagination_class = OperationsPagination
    queryset = User.objects.filter(role='customer').order_by('-created_at', '-id')


class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminSession]
    serializer_class = AuditLogSerializer
    pagination_class = OperationsPagination
    queryset = AuditLog.objects.all()

class AdminReferralRewardViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminSession]
    serializer_class = ReferralRewardSerializer
    pagination_class = OperationsPagination
    queryset = ReferralReward.objects.select_related('referrer', 'referred_user').order_by('-created_at', '-id')

    @extend_schema(request=DisburseRewardSerializer, responses={200: ReferralRewardSerializer})
    @action(detail=False, methods=['post'])
    def disburse(self, request):
        serializer = DisburseRewardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reward_id = serializer.validated_data['reward_id']
        
        try:
            reward = disburse_referral_reward(reward_id, request.user,
                amount=serializer.validated_data['amount'],
                payment_reference=serializer.validated_data['payment_reference'],
                note=serializer.validated_data['note'], bank_details=serializer.validated_data['bank_details'])
            return Response(self.get_serializer(reward).data, status=status.HTTP_200_OK)
        except ReferralReward.DoesNotExist:
            return Response({'detail': 'Reward not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    @extend_schema(responses=AuditLogSerializer(many=True))
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        reward = self.get_object()
        events = AuditLog.objects.filter(target_type='payments.referralreward', target_id=reward.pk).order_by('-created_at', '-id')
        return Response(AuditLogSerializer(events, many=True).data)
# SIRI.DEV
