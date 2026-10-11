from django.core.management.base import BaseCommand
from apps.documents.models import PendingFileDeletion
from apps.documents.services import cleanup_pending_files


class Command(BaseCommand):
    help = 'Retry deletion of files left behind by committed document changes.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=100)

    def handle(self, *args, **options):
        completed = cleanup_pending_files(limit=max(1, options['limit']))
        self.stdout.write(f'Deleted {completed} files; {PendingFileDeletion.objects.count()} cleanup jobs remain.')
# SIRI.DEV
