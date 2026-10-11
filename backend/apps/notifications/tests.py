from django.test import TestCase
from apps.accounts.models import User
from apps.applications.models import Application
from apps.services.models import Service
from .models import Notification
from .tasks import send_status_notification

class NotificationTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='applicant@example.com',
            password='password123',
            full_name='Applicant User'
        )
        self.service = Service.objects.create(
            name='Change of Name',
            slug='change-of-name-notif',
            description='Test service',
            base_price=5000.00, internal_cost=100.00, category='Category'
        )
        self.application = Application.objects.create(
            reference_no='NA-TEST-1234',
            user=self.user,
            service=self.service,
            status='received'
        )

    def test_status_notification_task_creates_record(self):
        # Call the Celery task synchronously for testing
        from apps.applications.models import StatusHistory
        StatusHistory.objects.create(application=self.application, status='processing')
        send_status_notification(self.application.id, 'processing')
        
        # Verify a Notification record was created
        notifications = Notification.objects.filter(user=self.user, application=self.application)
        self.assertEqual(notifications.count(), 1)
        
        notification = notifications.first()
        self.assertEqual(notification.type, 'status_update')
        self.assertEqual(notification.channel, 'email')
        self.assertIsNone(notification.sent_at)
        self.assertEqual(notification.state, "preview")
# SIRI.DEV
