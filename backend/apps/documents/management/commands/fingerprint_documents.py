from django.core.management.base import BaseCommand
from apps.documents.models import Document
from apps.documents.fingerprints import fingerprint_file


class Command(BaseCommand):
    help = 'Fingerprint existing uploads so duplicate previews can be grouped. Does not delete files or records.'

    def handle(self, *args, **options):
        updated = skipped = 0
        for document in Document.objects.filter(content_sha256='').iterator(chunk_size=100):
            try:
                with document.file.open('rb') as file:
                    fingerprint = fingerprint_file(file)
            except Exception:
                # Unavailable storage should not merge unrelated documents or block others.
                skipped += 1
                self.stderr.write(f'Could not read document {document.pk}; left ungrouped.')
                continue
            updated += Document.objects.filter(pk=document.pk, file=document.file.name, content_sha256='').update(
                content_sha256=fingerprint)
        self.stdout.write(f'Fingerprinted {updated} documents; {skipped} unreadable documents left unchanged.')
# SIRI.DEV
