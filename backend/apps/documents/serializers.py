from rest_framework import serializers
from .validation import DOCUMENT_TYPES, validate_upload


class DocumentUploadSerializer(serializers.Serializer):
    application = serializers.UUIDField()
    doc_type = serializers.ChoiceField(choices=list(DOCUMENT_TYPES))
    file = serializers.FileField(validators=[validate_upload], max_length=255)


class DocumentVersionSerializer(serializers.Serializer):
    updated_at = serializers.DateTimeField()


class DocumentReplaceSerializer(DocumentVersionSerializer):
    file = serializers.FileField(validators=[validate_upload], max_length=255)
# SIRI.DEV
