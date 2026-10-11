from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from .services import valid_session

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'auth_provider', 'email_verified', 'referral_code', 'bank_name', 'account_number', 'account_name']
        read_only_fields = ['id', 'role', 'auth_provider', 'email_verified', 'referral_code']

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_referral_code(self, value):
        if value:
            referrer = User.objects.filter(referral_code=value).first()
            if not referrer:
                raise serializers.ValidationError('Invalid referral code.')
            return referrer
        return None

    def validate(self, attrs):
        user = User(email=attrs['email'], full_name=attrs['full_name'])
        try:
            validate_password(attrs['password'], user=user)
        except ValidationError as exc:
            raise serializers.ValidationError({'password': exc.messages})
        return attrs

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'password', 'referral_code']

    def create(self, validated_data):
        referrer = validated_data.pop('referral_code', None)
        validated_data.update(role='customer', is_staff=False, is_superuser=False)
        user = User.objects.create_user(**validated_data)
        
        if referrer:
            user.referred_by = referrer
            user.save(update_fields=['referred_by'])
            from apps.payments.models import ReferralReward
            ReferralReward.objects.create(
                referrer=referrer,
                referred_user=user,
                amount=500.00,
                status='pending'
            )
            
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)


class AdminLoginSerializer(LoginSerializer):
    otp = serializers.RegexField(r'^[0-9]{6}$', write_only=True)


class AuthResultSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)


class SessionRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        session = valid_session(RefreshToken(attrs['refresh']))
        data = super().validate(attrs)
        access = AccessToken(data['access'])
        expiry = min(session.expires_at, timezone.now() + timedelta(
            minutes=5 if session.scope == 'admin' else 15,
        ))
        access['exp'] = int(expiry.timestamp())
        data['access'] = str(access)
        if 'refresh' in data:
            refresh = RefreshToken(data['refresh'])
            refresh['exp'] = int(session.expires_at.timestamp())
            data['refresh'] = str(refresh)
        return data

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'phone', 'bank_name', 'account_number', 'account_name']
# SIRI.DEV
