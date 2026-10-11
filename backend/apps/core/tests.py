from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import redis
from django.conf import settings
from unittest.mock import patch

class HealthCheckViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('health')

    @patch('redis.Redis.ping')
    def test_health_check_success(self, mock_ping):
        mock_ping.return_value = True
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        self.assertEqual(response.data['db'], 'ok')
        self.assertEqual(response.data['redis'], 'ok')

    @patch('redis.Redis.ping')
    def test_health_check_redis_failure(self, mock_ping):
        mock_ping.side_effect = redis.ConnectionError("Failed to connect")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['status'], 'ok')
        self.assertEqual(response.data['db'], 'ok')
        self.assertEqual(response.data['redis'], 'failed')
# SIRI.DEV
