from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from django.test import override_settings
from unittest.mock import patch
from datetime import timedelta
import pyotp
from cryptography.fernet import Fernet

User = get_user_model()


class AuthenticationTests(APITestCase):
    password = 'River!Juniper-38-Wave'

    def signup(self, **overrides):
        data = {'full_name': 'Ada Okafor', 'email': 'ada@example.com', 'password': self.password}
        data.update(overrides)
        return self.client.post(reverse('signup'), data, format='json')

    def test_signup_returns_session_and_hashes_password(self):
        response = self.signup(email='ADA@EXAMPLE.COM', role='admin')
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email='ada@example.com')
        self.assertTrue(user.check_password(self.password))
        self.assertNotEqual(user.password, self.password)
        self.assertEqual(user.role, 'customer')
        self.assertNotIn('password', response.data['user'])
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
        profile = self.client.get(reverse('auth_me'))
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['id'], str(user.id))

    def test_duplicate_email_is_case_insensitive(self):
        self.signup()
        response = self.signup(email='ADA@example.com')
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)
        self.assertEqual(User.objects.count(), 1)

    def test_weak_password_is_rejected(self):
        response = self.signup(password='12345678')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)
        self.assertFalse(User.objects.exists())

    def test_required_fields_are_validated(self):
        response = self.client.post(reverse('signup'), {}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertTrue({'email', 'password', 'full_name'}.issubset(response.data))

    def test_non_object_login_payload_is_rejected_without_server_error(self):
        response = self.client.post(reverse('login'), [], format='json')
        self.assertEqual(response.status_code, 400)

    def test_login_case_insensitive_and_password_whitespace_preserved(self):
        password = '  ' + self.password + '  '
        self.signup(password=password)
        response = self.client.post(reverse('login'), {'email': 'ADA@EXAMPLE.COM', 'password': password})
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['email'], 'ada@example.com')
        response = self.client.post(reverse('login'), {'email': 'ada@example.com', 'password': password.strip()})
        self.assertEqual(response.status_code, 401)

    def test_invalid_credentials_and_inactive_user_are_rejected(self):
        self.signup()
        for email in ['ada@example.com', 'missing@example.com']:
            response = self.client.post(reverse('login'), {'email': email, 'password': 'wrong'})
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.data['detail'], 'Invalid email or password.')
        User.objects.update(is_active=False)
        response = self.client.post(reverse('login'), {'email': 'ada@example.com', 'password': self.password})
        self.assertEqual(response.status_code, 401)

    def test_profile_requires_authentication(self):
        self.assertEqual(self.client.get(reverse('auth_me')).status_code, 401)

    def test_refresh_rotation_and_logout(self):
        original = self.signup().data['refresh']
        response = self.client.post(reverse('token_refresh'), {'refresh': original})
        self.assertEqual(response.status_code, 200)
        rotated = response.data['refresh']
        self.assertNotEqual(original, rotated)
        self.assertEqual(self.client.post(reverse('token_refresh'), {'refresh': original}).status_code, 401)
        self.assertEqual(self.client.post(reverse('logout'), {'refresh': rotated}).status_code, 200)
        self.assertEqual(self.client.post(reverse('token_refresh'), {'refresh': rotated}).status_code, 401)

    def test_logout_revokes_existing_access_token(self):
        session = self.signup().data
        self.client.post(reverse('logout'), {'refresh': session['refresh']})
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get(reverse('auth_me')).status_code, 401)

    def test_customer_cannot_use_admin_login(self):
        self.signup()
        response = self.client.post('/api/v1/admin/auth/login/', {
            'email': 'ada@example.com', 'password': self.password, 'otp': '123456',
        }, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertNotIn('access', response.data)

    @override_settings(LOGIN_ACCOUNT_LIMIT=5)
    def test_login_attempts_are_limited_across_both_login_routes(self):
        for _ in range(5):
            self.client.post(reverse('login'), {'email': 'missing@example.com', 'password': 'wrong'})
        response = self.client.post('/api/v1/admin/auth/login/', {
            'email': 'MISSING@example.com', 'password': 'wrong', 'otp': '123456',
        }, format='json')
        self.assertEqual(response.status_code, 429)
        self.assertIn('Retry-After', response.headers)


@override_settings(MFA_ENCRYPTION_KEY=Fernet.generate_key().decode())
class AdminSecurityTests(APITestCase):
    password = 'River!Juniper-38-Wave'
    secret = 'JBSWY3DPEHPK3PXP'

    def setUp(self):
        from .services import mfa_cipher
        self.admin = User.objects.create_user(
            email='admin@example.com', password=self.password, full_name='Operations Admin', role='admin',
        )
        self.admin.admin_mfa_secret = mfa_cipher().encrypt(self.secret.encode()).decode()
        self.admin.save()

    def login(self, **overrides):
        from django.utils import timezone
        data = {'email': self.admin.email, 'password': self.password,
                'otp': pyotp.TOTP(self.secret).at(timezone.now().timestamp())}
        data.update(overrides)
        return self.client.post('/api/v1/admin/auth/login/', data, format='json')

    def test_admin_requires_mfa_and_code_cannot_be_replayed(self):
        self.assertEqual(self.login(otp='000000').status_code, 401)
        from django.utils import timezone
        otp = pyotp.TOTP(self.secret).at(timezone.now().timestamp())
        session = self.login(otp=otp)
        self.assertEqual(session.status_code, 200)
        self.assertEqual(self.login(otp=otp).status_code, 401)
        self.assertNotIn('admin_mfa_secret', session.data['user'])
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session.data['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 200)

    def test_admin_cannot_bypass_mfa_through_customer_login(self):
        response = self.client.post(reverse('login'), {'email': self.admin.email, 'password': self.password})
        self.assertIn(response.status_code, (401, 403))
        self.assertNotIn('access', response.data)

    @override_settings(MFA_ENCRYPTION_KEY='')
    def test_missing_mfa_configuration_fails_closed(self):
        self.assertEqual(self.login().status_code, 401)

    def test_logout_role_change_and_deactivation_revoke_admin_sessions(self):
        session = self.login().data
        self.client.post(reverse('logout'), {'refresh': session['refresh']})
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)
        self.assertEqual(self.client.post(reverse('token_refresh'), {'refresh': session['refresh']}).status_code, 401)
        from .services import create_session_tokens
        for field, value in [('is_active', False), ('role', 'staff')]:
            self.admin.refresh_from_db()
            self.admin.is_active, self.admin.role = True, 'admin'
            self.admin.save()
            session = create_session_tokens(self.admin, 'admin')
            setattr(self.admin, field, value)
            self.admin.save()
            self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
            self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)
            self.client.credentials()
            self.assertEqual(self.client.post(reverse('token_refresh'), {'refresh': session['refresh']}).status_code, 401)

    def test_non_admin_session_does_not_gain_operations_access(self):
        from .services import create_session_tokens
        session = create_session_tokens(self.admin, 'customer')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 403)

    def test_legacy_tokens_without_server_session_are_rejected(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token.access_token))
        self.assertEqual(self.client.get(reverse('auth_me')).status_code, 401)

    def test_malformed_session_id_is_rejected_without_server_error(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.admin)
        token['sid'] = 'not-a-uuid'
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token.access_token))
        self.assertEqual(self.client.get(reverse('auth_me')).status_code, 401)

    def test_admin_refresh_preserves_short_access_and_fixed_session_expiry(self):
        from django.utils import timezone
        from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
        from .models import AuthSession
        session = self.login().data
        original = RefreshToken(session['refresh'])
        response = self.client.post(reverse('token_refresh'), {'refresh': session['refresh']})
        self.assertEqual(response.status_code, 200)
        access = AccessToken(response.data['access'])
        self.assertLessEqual(access['exp'] - access['iat'], 300)
        self.assertEqual(RefreshToken(response.data['refresh'])['exp'], original['exp'])
        AuthSession.objects.filter(pk=original['sid']).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post(reverse('token_refresh'), {'refresh': response.data['refresh']}).status_code, 401)

    def test_reactivation_does_not_restore_old_admin_access(self):
        session = self.login().data
        self.admin.is_active = False
        self.admin.save(update_fields=['is_active'])
        self.admin.is_active = True
        self.admin.save(update_fields=['is_active'])
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)

    def test_bulk_deactivation_and_reactivation_revoke_existing_sessions(self):
        session = self.login().data
        User.objects.filter(pk=self.admin.pk).update(is_active=False)
        User.objects.filter(pk=self.admin.pk).update(is_active=True)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)

    def test_saving_stale_user_cannot_resurrect_revoked_access(self):
        session = self.login().data
        User.objects.filter(pk=self.admin.pk).update(is_active=False)
        User.objects.filter(pk=self.admin.pk).update(is_active=True)
        self.admin.full_name = 'Updated name'
        self.admin.save()
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + session['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)

    def test_unrelated_user_save_cannot_restore_consumed_mfa_code(self):
        otp = pyotp.TOTP(self.secret).now()
        self.assertEqual(self.login(otp=otp).status_code, 200)
        self.assertEqual(self.login(otp=otp).status_code, 401)
        self.admin.full_name = 'Updated name'
        self.admin.save()
        self.assertEqual(self.login(otp=otp).status_code, 401)

    def test_intervening_password_write_cannot_escape_session_revocation(self):
        from django.contrib.auth.hashers import make_password
        from django.db.models.signals import pre_save
        from .services import create_session_tokens
        issued = {}

        def intervening_write(sender, instance, **kwargs):
            if instance is self.admin:
                User.objects.filter(pk=self.admin.pk).update(password=make_password('New!Password-51'))
                changed = User.objects.get(pk=self.admin.pk)
                issued.update(create_session_tokens(changed, 'admin'))

        # Deterministically place a competing write between model preparation
        # and SQL persistence; the final UPDATE must compare current DB values.
        pre_save.connect(intervening_write, sender=User, weak=False)
        try:
            self.admin.full_name = 'Updated name'
            self.admin.save()
        finally:
            pre_save.disconnect(intervening_write, sender=User)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + issued['access'])
        self.assertEqual(self.client.get('/api/v1/admin/applications/').status_code, 401)

    def test_mfa_enrollment_requires_authenticator_confirmation(self):
        from django.core.management import call_command
        from django.core.management.base import CommandError
        from io import StringIO
        output = StringIO()
        with patch('pyotp.random_base32', return_value=self.secret), patch('getpass.getpass', return_value='invalid'):
            with self.assertRaises(CommandError):
                call_command('enroll_admin_mfa', self.admin.email, reset=True, stdout=output)
        self.admin.refresh_from_db()
        previous = self.admin.session_version
        with patch('pyotp.random_base32', return_value=self.secret), patch('getpass.getpass', return_value=pyotp.TOTP(self.secret).now()):
            call_command('enroll_admin_mfa', self.admin.email, reset=True, stdout=output)
        self.admin.refresh_from_db()
        self.assertGreater(self.admin.session_version, previous)
        from .services import mfa_cipher
        self.assertEqual(mfa_cipher().decrypt(self.admin.admin_mfa_secret.encode()).decode(), self.secret)

    def test_swagger_describes_mfa_login_and_bearer_protected_operations(self):
        from drf_spectacular.generators import SchemaGenerator
        schema = SchemaGenerator().get_schema(request=None, public=True)
        self.assertIn({'jwtAuth': []}, schema['paths']['/api/v1/admin/applications/']['get']['security'])
        login = schema['paths']['/api/v1/admin/auth/login/']['post']
        request_schema = login['requestBody']['content']['application/json']['schema']
        component = request_schema['$ref'].split('/')[-1]
        self.assertIn('otp', schema['components']['schemas'][component]['required'])

from unittest.mock import patch

class GoogleAuthTests(APITestCase):
    @patch("apps.accounts.views.id_token.verify_oauth2_token")
    def test_google_auth_success_new_user(self, mock_verify):
        mock_verify.return_value = {
            "email": "newgoogle@example.com",
            "sub": "123456789",
            "name": "Google User"
        }
        response = self.client.post("/api/v1/auth/google/", {"id_token": "mocked_token"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        user = User.objects.get(email="newgoogle@example.com")
        self.assertEqual(user.auth_provider, "google")
        self.assertEqual(user.google_id, "123456789")

    @patch("apps.accounts.views.id_token.verify_oauth2_token")
    def test_google_auth_success_existing_user(self, mock_verify):
        user = User.objects.create_user(email="existing@example.com", full_name="Existing User", auth_provider="google", google_id="987654321")
        mock_verify.return_value = {
            "email": "existing@example.com",
            "sub": "987654321",
            "name": "Existing User"
        }
        response = self.client.post("/api/v1/auth/google/", {"id_token": "mocked_token"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    @patch("apps.accounts.views.id_token.verify_oauth2_token")
    def test_google_auth_invalid_token(self, mock_verify):
        mock_verify.side_effect = ValueError("Invalid token")
        response = self.client.post("/api/v1/auth/google/", {"id_token": "mocked_token"}, format="json")
        self.assertEqual(response.status_code, 401)

from django.core.signing import TimestampSigner

class EmailVerificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='verify@example.com',
            password='password123',
            full_name='Verify Test User'
        )
        self.signer = TimestampSigner()

    def test_verify_email_valid_token(self):
        self.assertFalse(self.user.email_verified)
        token = self.signer.sign(self.user.email)
        
        response = self.client.post('/api/v1/auth/verify-email/', {'token': token}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Email verified successfully.')
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)

    def test_verify_email_invalid_token(self):
        response = self.client.post('/api/v1/auth/verify-email/', {'token': 'invalid_token:1234'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Invalid or expired verification token.')
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.email_verified)
        
    def test_verify_email_expired_token(self):
        from django.core.signing import b62_encode
        import time
        # Create a token that looks expired
        value = self.user.email
        timestamp = b62_encode(int(time.time() - 86401))
        val = "%s:%s" % (value, timestamp)
        token = "%s:%s" % (val, self.signer.signature(val))
        
        response = self.client.post('/api/v1/auth/verify-email/', {'token': token}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Invalid or expired verification token.')

@override_settings(EMAIL_DELIVERY_MODE='resend', RESEND_API_KEY='test-key', EMAIL_PAYLOAD_ENCRYPTION_KEY='test-only-key-at-least-32-characters')
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='reset@example.com',
            password='oldpassword123',
            full_name='Reset Test User'
        )

    def request_reset_token(self):
        from apps.notifications.models import Notification
        from apps.notifications.delivery import decode_payload
        from urllib.parse import urlsplit, parse_qs
        response = self.client.post('/api/v1/auth/password-reset/', {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, 200)
        text = decode_payload(Notification.objects.filter(type='password_reset').latest('created_at').payload)['text']
        link = next(line.split(': ', 1)[1] for line in text.splitlines() if line.startswith('Reset password: '))
        return parse_qs(urlsplit(link).fragment.split('?', 1)[1])['token'][0]

    def test_password_reset_token_cannot_be_reused(self):
        token = self.request_reset_token()
        url = '/api/v1/auth/password-reset/confirm/'
        first = self.client.post(url, {'token': token, 'new_password': 'FirstSecurePassword!123'}, format='json')
        self.assertEqual(first.status_code, 200)
        second = self.client.post(url, {'token': token, 'new_password': 'SecondSecurePassword!456'}, format='json')
        self.assertEqual(second.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('FirstSecurePassword!123'))

    def test_legacy_password_reset_token_is_rejected(self):
        token = TimestampSigner(salt='password-reset').sign(self.user.email)
        response = self.client.post('/api/v1/auth/password-reset/confirm/', {
            'token': token, 'new_password': 'NewSecurePassword!123'
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpassword123'))

    def test_invalid_password_does_not_consume_reset_token(self):
        token = self.request_reset_token()
        url = '/api/v1/auth/password-reset/confirm/'
        response = self.client.post(url, {'token': token, 'new_password': '123'}, format='json')
        self.assertEqual(response.status_code, 400)
        response = self.client.post(url, {'token': token, 'new_password': 'NewSecurePassword!123'}, format='json')
        self.assertEqual(response.status_code, 200)

    def test_password_reset_token_expires_after_one_hour(self):
        import time
        with patch('django.core.signing.time.time', return_value=time.time() - 3601):
            token = self.request_reset_token()
        response = self.client.post('/api/v1/auth/password-reset/confirm/', {
            'token': token, 'new_password': 'NewSecurePassword!123'
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_password_reset_flow(self):
        # 1. Request password reset
        response = self.client.post('/api/v1/auth/password-reset/', {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'If an account with this email exists, a password reset link has been sent.')
        
        # 2. Get the token (simulate reading email)
        token = self.request_reset_token()
        
        # 3. Confirm password reset with a valid new password
        new_password = 'NewSecurePassword!123'
        response = self.client.post('/api/v1/auth/password-reset/confirm/', {
            'token': token,
            'new_password': new_password
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Password has been reset successfully.')
        
        # 4. Verify old password no longer works
        self.user.refresh_from_db()
        self.assertFalse(self.user.check_password('oldpassword123'))
        
        # 5. Verify new password works
        self.assertTrue(self.user.check_password(new_password))

    def test_password_reset_invalid_token(self):
        response = self.client.post('/api/v1/auth/password-reset/confirm/', {
            'token': 'invalid_token:123',
            'new_password': 'NewSecurePassword!123'
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Invalid or expired password reset token.')

class ReferralSystemTests(APITestCase):
    def setUp(self):
        self.referrer = User.objects.create_user(
            email='referrer@example.com',
            password='password123',
            full_name='Referrer User'
        )
        self.referrer.refresh_from_db()

    def test_signup_with_valid_referral_code(self):
        response = self.client.post('/api/v1/auth/signup/', {
            'email': 'referee@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'Referee User',
            'phone': '1234567890',
            'referral_code': self.referrer.referral_code
        }, format='json')
        
        self.assertEqual(response.status_code, 201)
        
        referee = User.objects.get(email='referee@example.com')
        self.assertEqual(referee.referred_by, self.referrer)
        
        from apps.payments.models import ReferralReward
        reward = ReferralReward.objects.filter(referrer=self.referrer, referred_user=referee).first()
        self.assertIsNotNone(reward)
        self.assertEqual(reward.status, 'pending')
        self.assertEqual(reward.amount, 500.00)

    def test_signup_without_referral_code(self):
        response = self.client.post('/api/v1/auth/signup/', {
            'email': 'noref@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'No Ref User',
            'phone': '1234567890'
        }, format='json')
        
        self.assertEqual(response.status_code, 201)
        
        user = User.objects.get(email='noref@example.com')
        self.assertIsNone(user.referred_by)
        
        from apps.payments.models import ReferralReward
        reward_exists = ReferralReward.objects.filter(referred_user=user).exists()
        self.assertFalse(reward_exists)

    def test_signup_with_invalid_referral_code(self):
        response = self.client.post('/api/v1/auth/signup/', {
            'email': 'invalidref@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'Invalid Ref User',
            'referral_code': 'INVALIDCODE123'
        }, format='json')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('referral_code', response.data)

class ProfileUpdateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@example.com',
            password='password123',
            full_name='Profile User'
        )
        from apps.accounts.services import create_session_tokens
        tokens = create_session_tokens(self.user, 'customer')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])

    def test_profile_update_bank_details(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'bank_name': 'Test Bank',
            'account_number': '1234567890',
            'account_name': 'Profile User Test'
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['bank_name'], 'Test Bank')
        self.assertEqual(response.data['account_number'], '1234567890')
        self.assertEqual(response.data['account_name'], 'Profile User Test')
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.bank_name, 'Test Bank')
        self.assertEqual(self.user.account_number, '1234567890')
        self.assertEqual(self.user.account_name, 'Profile User Test')
# SIRI.DEV
