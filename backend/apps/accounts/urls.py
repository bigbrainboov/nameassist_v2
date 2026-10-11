from django.urls import path
from .views import SignupView, LoginView, GoogleAuthView, VerifyEmailView, PasswordResetView, PasswordResetConfirmView, MeView
from .views import LogoutView, ResendVerificationView

urlpatterns = [
    path('me/', MeView.as_view(), name='auth_me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('verify-email/resend/', ResendVerificationView.as_view(), name='resend_verification'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
# SIRI.DEV
