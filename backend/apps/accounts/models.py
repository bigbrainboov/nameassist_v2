import string
import random
from django.db import models
from django.db.models.functions import Greatest
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.core.models import TimeStampedModel

SECURITY_FIELDS = {'is_active', 'role', 'password', 'admin_mfa_secret'}


class UserQuerySet(models.QuerySet):
    def update(self, **kwargs):
        if SECURITY_FIELDS.intersection(kwargs):
            kwargs['session_version'] = models.F('session_version') + 1
        if 'admin_mfa_last_step' in kwargs:
            kwargs['admin_mfa_last_step'] = Greatest(models.F('admin_mfa_last_step'), kwargs['admin_mfa_last_step'])
        return super().update(**kwargs)


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('staff', 'Staff'),
        ('admin', 'Admin'),
    )

    AUTH_PROVIDER_CHOICES = (
        ('email', 'Email'),
        ('google', 'Google'),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)

    auth_provider = models.CharField(max_length=50, choices=AUTH_PROVIDER_CHOICES, default='email')
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    bank_name = models.CharField(max_length=255, blank=True, default='')
    account_number = models.CharField(max_length=50, blank=True, default='')
    account_name = models.CharField(max_length=255, blank=True, default='')


    email_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='customer')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    session_version = models.PositiveIntegerField(default=0, editable=False)
    admin_mfa_secret = models.TextField(blank=True, editable=False)
    admin_mfa_last_step = models.BigIntegerField(default=-1, editable=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        existing = not self._state.adding
        if existing:
            fields = SECURITY_FIELDS if kwargs.get('update_fields') is None else SECURITY_FIELDS.intersection(kwargs['update_fields'])
            # Compare values inside the UPDATE itself. A preliminary SELECT
            # cannot safely detect a competing account change before persistence.
            changed = models.Q()
            for field in fields:
                changed |= ~models.Q(**{field: getattr(self, field)})
            self.session_version = models.Case(
                models.When(changed, then=models.F('session_version') + 1),
                default=models.F('session_version'), output_field=models.PositiveIntegerField(),
            ) if fields else models.F('session_version')
            if fields:
                if kwargs.get('update_fields') is not None:
                    kwargs['update_fields'] = set(kwargs['update_fields']) | {'session_version'}
            # Consumed authenticator codes stay consumed even when saving an
            # object loaded before login, including bulk updates.
            self.admin_mfa_last_step = Greatest(models.F('admin_mfa_last_step'), self.admin_mfa_last_step)
        super().save(*args, **kwargs)
        if existing:
            self.refresh_from_db(fields=['session_version', 'admin_mfa_last_step'])


class AuthSession(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_sessions')
    scope = models.CharField(max_length=10, choices=[('customer', 'Customer'), ('admin', 'Admin')])
    version = models.PositiveIntegerField()
    expires_at = models.DateTimeField()
    revoked = models.BooleanField(default=False)


class LoginLimit(models.Model):
    # HMAC keys avoid keeping attempted email addresses in this table.
    key = models.CharField(max_length=64, primary_key=True)
    attempts = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
# SIRI.DEV
