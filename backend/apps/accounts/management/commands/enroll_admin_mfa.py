import getpass

import pyotp
from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.services import mfa_cipher


class Command(BaseCommand):
    help = 'Enroll an active admin in authenticator MFA. Requires access to the server environment.'

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument('--reset', action='store_true', help='Replace existing MFA and revoke existing sessions.')

    def handle(self, *args, **options):
        try:
            user = User.objects.get(email__iexact=options['email'], role='admin', is_active=True)
        except User.DoesNotExist:
            raise CommandError('An active admin account with this email is required.')
        if user.admin_mfa_secret and not options['reset']:
            raise CommandError('MFA is already enrolled. Use --reset to replace it.')
        try:
            cipher = mfa_cipher()
        except ImproperlyConfigured as exc:
            raise CommandError(str(exc))
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        self.stdout.write('Add this secret to your authenticator; keep it private: ' + secret)
        self.stdout.write(totp.provisioning_uri(name=user.email, issuer_name='NameAssist Admin'))
        otp = getpass.getpass('Authenticator code to confirm enrollment: ').strip()
        current_step = int(timezone.now().timestamp()) // 30
        step = next((value for value in (current_step, current_step - 1, current_step + 1)
                     if pyotp.utils.strings_equal(totp.at(value * 30), otp)), None)
        if step is None:
            raise CommandError('Invalid authenticator code. MFA was not changed.')
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=user.pk)
            if not user.is_active or user.role != 'admin':
                raise CommandError('This account no longer has admin access.')
            user.admin_mfa_secret = cipher.encrypt(secret.encode()).decode()
            user.admin_mfa_last_step = step
            user.save(update_fields=['admin_mfa_secret', 'admin_mfa_last_step'])
        self.stdout.write(self.style.SUCCESS('MFA enrolled. Existing sessions revoked; use the next authenticator code to log in.'))
# SIRI.DEV
