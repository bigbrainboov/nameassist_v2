from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, AuthSession
from .serializers import (UserSerializer, SignupSerializer, LoginSerializer, AdminLoginSerializer,
                          AuthResultSerializer, LogoutSerializer, GoogleAuthSerializer,
                          VerifyEmailSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer, ProfileUpdateSerializer)
from .services import create_session_tokens, verify_admin_otp, LoginThrottle, valid_session
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
from django.db import transaction
from .email_throttles import EmailActionThrottle
from apps.notifications.services import notify_signup, notify_password_reset, notify_verification

from google.oauth2 import id_token
from google.auth.transport import requests
import secrets



def auth_response(user, scope='customer'):
    return {'user': UserSerializer(user).data,
            **create_session_tokens(user, scope)}


def authenticate_login(request, data):
    email = data['email'].strip()
    existing = User.objects.filter(email__iexact=email).first()
    return authenticate(request, username=existing.email if existing else email, password=data['password'])

class SignupView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = SignupSerializer

    @extend_schema(responses={201: AuthResultSerializer})
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        notify_signup(user)

        return Response(auth_response(user), status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginThrottle]
    serializer_class = LoginSerializer

    @extend_schema(responses=AuthResultSerializer)
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate_login(request, serializer.validated_data)
        if user is None:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.role != 'customer':
            return Response({'detail': 'Use the admin login for this account.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(auth_response(user))


class AdminLoginView(LoginView):
    serializer_class = AdminLoginSerializer

    @extend_schema(responses=AuthResultSerializer)
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = authenticate_login(request, data)
        if not user or user.role != 'admin' or not verify_admin_otp(user, data['otp']):
            # APIView without an authentication class otherwise translates this to 403.
            return Response({'detail': 'Invalid admin credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(auth_response(user, 'admin'))


class LogoutView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LogoutSerializer

    @extend_schema(responses={200: None})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            refresh = RefreshToken(serializer.validated_data['refresh'])
            session = valid_session(refresh)
            AuthSession.objects.filter(pk=session.pk).update(revoked=True)
            refresh.blacklist()
        except (TokenError, AuthenticationFailed):
            return Response({'detail': 'Session expired.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return UserSerializer
        
    def perform_update(self, serializer):
        serializer.save()

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    serializer_class = GoogleAuthSerializer

    @transaction.atomic
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            id_info = id_token.verify_oauth2_token(
                serializer.validated_data["id_token"], 
                requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
        except ValueError:
            return Response({"detail": "Invalid or expired Google token."}, status=status.HTTP_401_UNAUTHORIZED)
            
        email = id_info.get("email")
        sub = id_info.get("sub")
        
        if not email or not sub:
            return Response({"detail": "Invalid token payload."}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                full_name=id_info.get("name", ""),
                password=secrets.token_urlsafe(32),
                auth_provider="google",
                google_id=sub,
                email_verified=True,
                role="customer",
            )
            notify_signup(user)
        elif user.auth_provider != "google":
            # If they existed but not as google, optionally update them. For now just login.
            pass
            
        return Response(auth_response(user), status=status.HTTP_200_OK)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = VerifyEmailSerializer

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data["token"]
        signer = TimestampSigner()
        
        try:
            # Token valid for 24 hours (86400 seconds)
            email = signer.unsign(token, max_age=86400)
        except (BadSignature, SignatureExpired):
            return Response({"detail": "Invalid or expired verification token."}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        
        return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PasswordResetSerializer
    throttle_classes = [EmailActionThrottle]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        
        if user and user.is_active:
            notify_password_reset(user)

        return Response({"message": "If an account with this email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]
        
        signer = TimestampSigner(salt="password-reset")
        try:
            # The signed envelope preserves the one-hour expiry and token-only API.
            payload = signer.unsign_object(token, max_age=3600)
            if not isinstance(payload, dict) or not isinstance(payload.get('email'), str) or not isinstance(payload.get('reset_token'), str):
                raise ValueError('Invalid reset payload')
        except (BadSignature, SignatureExpired, ValueError, TypeError):
            return Response({"detail": "Invalid or expired password reset token."}, status=status.HTTP_400_BAD_REQUEST)

        # Serialize token consumption so simultaneous requests cannot both succeed.
        with transaction.atomic():
            user = User.objects.select_for_update().filter(email__iexact=payload['email']).first()
            if not user or not default_token_generator.check_token(user, payload['reset_token']):
                return Response({"detail": "Invalid or expired password reset token."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_password(new_password, user=user)
            except DjangoValidationError as exc:
                return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)



class ResendVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [EmailActionThrottle]

    def post(self, request):
        if request.user.role != 'customer':
            return Response({'detail': 'Customer account required.'}, status=403)
        if not request.user.email_verified:
            notify_verification(request.user)
        return Response({'message': 'If verification is needed, an email will be sent shortly.'})
# SIRI.DEV
