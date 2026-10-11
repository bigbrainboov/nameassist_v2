from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "apps.accounts"

    def ready(self):
        from drf_spectacular.contrib.rest_framework_simplejwt import SimpleJWTScheme

        class SessionJWTScheme(SimpleJWTScheme):
            target_class = 'apps.accounts.services.SessionJWTAuthentication'
# SIRI.DEV
