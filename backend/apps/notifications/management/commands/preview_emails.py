from pathlib import Path
from django.core.management.base import BaseCommand
from apps.notifications.rendering import COPY, render_email, frontend_url


class Command(BaseCommand):
    help = 'Render all transactional emails using fictional data; never sends email.'

    def add_arguments(self, parser):
        parser.add_argument('--output', required=True)

    def handle(self, *args, **options):
        output = Path(options['output'])
        output.mkdir(parents=True, exist_ok=True)
        links = []
        for kind in COPY:
            context = dict(first_name='Ada', reference='NA-DEMO-2026', service='Change of Name',
                title='Your account update', message='Your profile has been updated successfully.')
            if kind == 'payment_confirmation':
                context.update(amount='25,000.00', currency='NGN', payment_reference='NA-PAY-DEMO', date='1 October 2026')
            if kind == 'status_update':
                context.update(status='Document review', description='Our team is checking your submitted documents.')
            if kind in ('verification', 'password_reset'):
                context['action_url'] = frontend_url('/verify-email' if kind == 'verification' else '/reset-password', {'token': 'preview-only'})
            if kind == 'request_received':
                context['awaiting_payment'] = True
            email = render_email(kind, context)
            (output / f'{kind}.html').write_text(email['html'])
            (output / f'{kind}.txt').write_text(email['text'])
            links.append(f'<li><a href="{kind}.html">{email["subject"]}</a> · <a href="{kind}.txt">Plain text</a></li>')
        (output / 'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>NameAssist emails</title><body style="font:18px Arial;padding:40px;background:#F5F7F6;color:#003D35"><h1>NameAssist email previews</h1><p>Fictional data. No emails sent.</p><ul>' + ''.join(links) + '</ul></body></html>')
        self.stdout.write(str(output / 'index.html'))
# SIRI.DEV
