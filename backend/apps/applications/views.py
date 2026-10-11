from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.core.serializers import ApplicationSerializer
from apps.services.models import Service
from .models import Newspaper, ChangeOfNameDetails
from .submission import SubmissionSerializer, submit_application, DOCUMENT_TYPES, MAX_FILES, MAX_FILE_SIZE


class NewspaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newspaper
        fields = ['slug', 'name', 'logo_url']


class OptionsSerializer(serializers.Serializer):
    newspapers = NewspaperSerializer(many=True)
    change_of_name_available = serializers.BooleanField()
    document_types = serializers.DictField()
    fee = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    currency = serializers.CharField()
    max_files = serializers.IntegerField()
    max_file_size = serializers.IntegerField()


class ApplicationOptionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OptionsSerializer

    def get(self, request):
        service = Service.objects.filter(slug='change-of-name', is_active=True).first()
        return Response({
            'fee': str(service.base_price) if service else None, 'currency': 'NGN',
            'newspapers': NewspaperSerializer(Newspaper.objects.filter(is_available=True), many=True).data,
            'change_of_name_available': Service.objects.filter(slug='change-of-name', is_active=True).exists(),
            'document_types': DOCUMENT_TYPES, 'max_files': MAX_FILES, 'max_file_size': MAX_FILE_SIZE,
        })


class ChangeOfNameSubmissionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = SubmissionSerializer

    @extend_schema(responses={201: ApplicationSerializer, 200: ApplicationSerializer})
    def post(self, request):
        if request.user.role != 'customer':
            raise PermissionDenied('Customer accounts are required to submit applications.')
        try:
            submission_id = serializers.UUIDField().run_validation(request.data.get('submission_id'))
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({'submission_id': exc.detail})
        existing = ChangeOfNameDetails.objects.select_related('application').filter(
            user=request.user, submission_id=submission_id,
        ).first()
        if existing:
            return Response(ApplicationSerializer(existing.application).data)
        unknown = set(request.FILES) - set(DOCUMENT_TYPES)
        if unknown:
            raise serializers.ValidationError({'detail': 'Unrecognized document category.'})
        if len(request.FILES.getlist('affidavit')) > 1:
            raise serializers.ValidationError({'affidavit': 'Upload one sworn affidavit.'})
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application, created = submit_application(request.user, dict(serializer.validated_data))
        return Response(ApplicationSerializer(application).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
# SIRI.DEV
