from apps.accounts.views import AdminLoginView
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny

urlpatterns = [
    # The unused Django admin is not exposed: it would bypass authenticator MFA.
    path('api/v1/admin/auth/login/', AdminLoginView.as_view(), name='admin_login'),

    # API endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/', include('apps.core.urls')),

    # OpenAPI Schema
    path('api/v1/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny], authentication_classes=[]), name='schema'),
    path('api/v1/schema/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny], authentication_classes=[]), name='swagger-ui'),
]
# SIRI.DEV
