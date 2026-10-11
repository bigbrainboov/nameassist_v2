from .base import *
import os

DEBUG = False

# Support Render domains and custom domains.
# RENDER_EXTERNAL_HOSTNAME is provided by Render by default.
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[env('RENDER_EXTERNAL_HOSTNAME', default='')])

# Filter out empty strings if RENDER_EXTERNAL_HOSTNAME is not set locally
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

# Configure CORS for the frontend origin
frontend_url = env('FRONTEND_URL', default='')
if frontend_url:
    CORS_ALLOWED_ORIGINS = [frontend_url]

# Prepend WhiteNoise middleware for serving static files efficiently in production
MIDDLEWARE.insert(
    MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,
    'whitenoise.middleware.WhiteNoiseMiddleware'
)

# Overwrite static files storage to use WhiteNoise for caching and compression
STORAGES['staticfiles'] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}
# SIRI.DEV
