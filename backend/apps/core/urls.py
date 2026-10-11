from apps.applications.views import ApplicationOptionsView, ChangeOfNameSubmissionView
from apps.payments.views import InitializePaymentView, PaystackWebhookView, VerifyPaymentView
from django.urls import path
from rest_framework.routers import SimpleRouter
from .views import (HealthCheckView, CustomerApplicationViewSet, CustomerDocumentViewSet, CustomerPaymentViewSet,
                    AdminApplicationViewSet, AdminDocumentViewSet, AdminPaymentViewSet, AdminCustomerViewSet, AdminAuditLogViewSet, AdminReferralRewardViewSet)

router = SimpleRouter()
router.register('applications', CustomerApplicationViewSet, basename='applications')
router.register('documents', CustomerDocumentViewSet, basename='documents')
router.register('payments', CustomerPaymentViewSet, basename='payments')
router.register('admin/applications', AdminApplicationViewSet, basename='admin-applications')
router.register('admin/documents', AdminDocumentViewSet, basename='admin-documents')
router.register('admin/payments', AdminPaymentViewSet, basename='admin-payments')
router.register('admin/customers', AdminCustomerViewSet, basename='admin-customers')
router.register('admin/audit-logs', AdminAuditLogViewSet, basename='admin-audit-logs')
router.register('admin/referral-rewards', AdminReferralRewardViewSet, basename='admin-referral-rewards')

urlpatterns = [
    path('applications/options/', ApplicationOptionsView.as_view()),
    path('applications/change-of-name/', ChangeOfNameSubmissionView.as_view()),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('payments/verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('payments/initialize/', InitializePaymentView.as_view(), name='payment-initialize'),
    path('payments/webhook/paystack/', PaystackWebhookView.as_view(), name='payment-webhook'),
] + router.urls
# SIRI.DEV
