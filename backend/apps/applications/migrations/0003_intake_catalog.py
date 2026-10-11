from django.db import migrations


def seed_catalog(apps, schema_editor):
    Service = apps.get_model('services', 'Service')
    Service.objects.get_or_create(slug='change-of-name', defaults={
        'name': 'Change of Name', 'category': 'Identity & Name',
        'description': 'Submit former and new names, supporting documents, and your newspaper preference.',
        'base_price': '45000.00', 'internal_cost': '0.00', 'is_active': True,
    })
    Newspaper = apps.get_model('applications', 'Newspaper')
    extensions = {'punch': 'png', 'vanguard': 'svg', 'guardian': 'webp', 'the-nation': 'svg'}
    for slug, name in [('punch', 'Punch'), ('vanguard', 'Vanguard'), ('guardian', 'The Guardian'), ('the-nation', 'The Nation')]:
        Newspaper.objects.get_or_create(slug=slug, defaults={
            'name': name, 'logo_url': f'/assets/newspapers/{slug}.{extensions[slug]}', 'is_available': True,
        })


class Migration(migrations.Migration):
    dependencies = [('applications', '0002_newspaper_changeofnamedetails'), ('services', '0002_service_slug')]
    operations = [migrations.RunPython(seed_catalog, migrations.RunPython.noop)]
# SIRI.DEV
