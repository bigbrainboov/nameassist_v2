from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .serializers import DocumentUploadSerializer, DocumentReplaceSerializer, DocumentVersionSerializer
from .services import mutate_document


class CustomerDocumentMutationMixin:
    def validate_mutation(self, serializer_class):
        # Do not silently drop extra files from a multipart request.
        if set(self.request.FILES) - {'file'} or len(self.request.FILES.getlist('file')) > 1:
            raise ValidationError('Upload one file per request.')
        serializer = serializer_class(data=self.request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    @extend_schema(request=DocumentUploadSerializer)
    def create(self, request):
        data = self.validate_mutation(DocumentUploadSerializer)
        document = mutate_document(request.user, application_id=data['application'],
                                   upload=data['file'], doc_type=data['doc_type'])
        return Response(self.get_serializer(document).data, status=201)

    @extend_schema(request=DocumentReplaceSerializer)
    @action(detail=True, methods=['post'])
    def replace(self, request, pk=None):
        document = self.get_object()
        data = self.validate_mutation(DocumentReplaceSerializer)
        document = mutate_document(request.user, document_id=document.pk,
                                   upload=data['file'], updated_at=data['updated_at'])
        return Response(self.get_serializer(document).data)

    @extend_schema(request=DocumentVersionSerializer, responses={204: None})
    def destroy(self, request, pk=None):
        document = self.get_object()
        data = self.validate_mutation(DocumentVersionSerializer)
        mutate_document(request.user, document_id=document.pk, updated_at=data['updated_at'])
        return Response(status=204)
# SIRI.DEV
