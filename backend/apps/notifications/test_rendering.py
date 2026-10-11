from django.test import SimpleTestCase, override_settings
from .rendering import render_email, frontend_url


@override_settings(FRONTEND_URL='https://nameassist.vercel.app', EMAIL_LOGO_URL='')
class RenderingTests(SimpleTestCase):
    def test_all_variants_have_html_text_and_escaped_customer_content(self):
        for kind in ('welcome', 'verification', 'request_received', 'payment_confirmation',
                     'status_update', 'request_completed', 'password_reset', 'general'):
            with self.subTest(kind=kind):
                email = render_email(kind, {'first_name': '<script>Ada</script>', 'reference': 'NA-123',
                    'service': 'Change of Name', 'amount': '5,000.00', 'currency': 'NGN',
                    'payment_reference': 'PAY-123', 'date': '1 October 2026', 'status': 'Document review',
                    'description': 'Your documents are being checked.', 'title': 'An update',
                    'message': '<b>Hello</b>', 'action_url': frontend_url('/dashboard')})
                self.assertIn('&lt;script&gt;', email['html'])
                self.assertNotIn('<script>', email['html'])
                self.assertIn('NameAssist', email['html'])
                self.assertTrue(email['text'])
                self.assertTrue(email['subject'])

    def test_security_copy_and_encoded_links(self):
        url = frontend_url('/reset-password', {'token': 'a:b+c/&'})
        self.assertEqual(url, 'https://nameassist.vercel.app/#/reset-password?token=a%3Ab%2Bc%2F%26')
        self.assertIn('one hour', render_email('password_reset', {'action_url': url})['text'])
        self.assertIn('24 hours', render_email('verification', {'action_url': url})['text'])

    def test_completion_and_payment_details(self):
        email = render_email('request_completed', {'reference': 'NA-123', 'service': 'Change of Name'})
        self.assertIn('#/dashboard/documents', email['html'])
        self.assertIn('NA-123', email['text'])
        receipt = render_email('payment_confirmation', {'reference': 'NA-123', 'amount': '5,000.00',
            'currency': 'NGN', 'payment_reference': 'PAY-123', 'date': '1 October 2026'})
        self.assertIn('NGN 5,000.00', receipt['text'])
        self.assertIn('PAY-123', receipt['text'])

    def test_untrusted_action_url_rejected(self):
        for url in ('javascript:alert(1)', 'https://evil.example/reset', 'https://user:pass@nameassist.vercel.app/'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                render_email('general', {'title': 'Hello', 'message': 'Hello', 'action_url': url})

    def test_optional_name_fallback_and_unknown_variant(self):
        self.assertIn('Hello there', render_email('welcome', {})['text'])
        with self.assertRaises(ValueError):
            render_email('unknown', {})
# SIRI.DEV
