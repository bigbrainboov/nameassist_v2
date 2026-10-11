from django.contrib.auth.tokens import default_token_generator
from django.core.signing import TimestampSigner


def make_verification_token(user):
    return TimestampSigner().sign(user.email)


def make_password_reset_token(user):
    return TimestampSigner(salt='password-reset').sign_object({
        'email': user.email, 'reset_token': default_token_generator.make_token(user)})
# SIRI.DEV
