from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_slug
from django.core.exceptions import ValidationError
from apps.applications.models import Newspaper


class Command(BaseCommand):
    help = 'List newspapers or set availability from a trusted operator terminal.'

    def add_arguments(self, parser):
        parser.add_argument('slug', nargs='?')
        parser.add_argument('--name')
        parser.add_argument('--logo-url')
        group = parser.add_mutually_exclusive_group()
        group.add_argument('--available', action='store_true')
        group.add_argument('--unavailable', action='store_true')

    def handle(self, *args, **options):
        slug = options['slug']
        if slug:
            try:
                validate_slug(slug)
            except ValidationError:
                raise CommandError('Use a slug with letters, numbers, hyphens or underscores.')
            newspaper = Newspaper.objects.filter(slug=slug).first()
            if not newspaper:
                if not options['name'] or not options['logo_url']:
                    raise CommandError('New newspapers require --name and --logo-url.')
                newspaper = Newspaper(slug=slug, is_available=False)
            if options['name']:
                newspaper.name = options['name']
            if options['logo_url']:
                newspaper.logo_url = options['logo_url']
            if options['available']:
                newspaper.is_available = True
            if options['unavailable']:
                newspaper.is_available = False
            newspaper.full_clean()
            newspaper.save()
        elif any(options[key] for key in ['name', 'logo_url', 'available', 'unavailable']):
            raise CommandError('Specify the newspaper slug to update.')
        for newspaper in Newspaper.objects.all():
            self.stdout.write(f'{newspaper.slug}: {newspaper.name} — {"available" if newspaper.is_available else "unavailable"}')
# SIRI.DEV
