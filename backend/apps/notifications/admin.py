from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('type', 'recipient', 'state', 'attempts', 'sent_at', 'last_error')
    list_filter = ('state', 'type')
    fields = ('id', 'type', 'recipient', 'subject', 'state', 'attempts', 'provider_message_id',
              'sent_at', 'next_attempt_at', 'expires_at', 'last_error', 'created_at')
    readonly_fields = fields

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
# SIRI.DEV
