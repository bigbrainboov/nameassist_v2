from django.core.exceptions import PermissionDenied
from .models import AuditLog


def record_admin_change(actor, target, action, before, after):
    if not actor or not actor.is_active or actor.role != 'admin':
        raise PermissionDenied('Admin access required.')
    return AuditLog.objects.create(
        actor=actor, actor_email=actor.email, action=action,
        target_type=target._meta.label_lower, target_id=target.pk,
        before=before, after=after,
    )
# SIRI.DEV
