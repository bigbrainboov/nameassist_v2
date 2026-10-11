from .base import *

ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

# Private development uploads are served only by authenticated API endpoints.
if not AWS_STORAGE_BUCKET_NAME:
    STORAGES['default'] = {'BACKEND': 'django.core.files.storage.FileSystemStorage'}
    MEDIA_ROOT = BASE_DIR / 'private_uploads'
# SIRI.DEV
