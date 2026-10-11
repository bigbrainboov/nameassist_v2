from pathlib import Path
from rest_framework import serializers

DOCUMENT_TYPES = {
    'affidavit': 'Sworn affidavit',
    'nin': 'NIN slip (NIMC)',
    'bvn_bank': 'BVN and bank account documents',
    'passport': 'International passport',
    'drivers_license': "Driver’s license",
    'education': 'Educational certificates',
    'work': 'Work certificates',
}
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_FILES = 10


def validate_upload(upload):
    if upload.size > MAX_FILE_SIZE:
        raise serializers.ValidationError('Each file must be 10 MB or smaller.')
    extension = Path(upload.name).suffix.lower()
    signature = upload.read(8)
    upload.seek(0)
    valid = ((extension == '.pdf' and signature.startswith(b'%PDF-')) or
             (extension in ('.jpg', '.jpeg') and signature.startswith(b'\xff\xd8\xff')) or
             (extension == '.png' and signature == b'\x89PNG\r\n\x1a\n'))
    if not valid:
        raise serializers.ValidationError('Upload a PDF, JPG or PNG file with matching contents.')
    return upload

# SIRI.DEV
