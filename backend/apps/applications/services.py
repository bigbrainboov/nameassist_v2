from django.db import transaction
from django.utils import timezone
from .models import Application, StatusHistory
from apps.documents.models import Document
from django.db.models import Max
from apps.core.services import record_admin_change

ALLOWED_TRANSITIONS = {
    "received": ["document_review"],
    "document_review": ["processing"],
    "processing": ["newspaper_publication", "final_documentation"], # allowing branching logic if some skip newspaper
    "newspaper_publication": ["final_documentation"],
    "final_documentation": ["completed"],
    "completed": [],
}

def transition_status(application, new_status, changed_by, note=""):
    """
    Transitions an application to a new status, recording history and validating state.
    """
    with transaction.atomic():
        application = Application.objects.select_for_update().get(pk=application.pk)
        from apps.payments.services import confirmed_payments
        if application.payment_amount is not None and not confirmed_payments(application).exists():
            raise ValueError('Payment must be confirmed before processing this application.')
        current_status = application.status
        if new_status not in ALLOWED_TRANSITIONS.get(current_status, []):
            raise ValueError(f"Invalid transition from {current_status} to {new_status}")
        if new_status == 'completed' and not Document.objects.filter(application=application, is_deliverable=True).exists():
            raise ValueError('Cannot mark application as completed without a deliverable document.')
        application.status = new_status
        application.save(update_fields=['status', 'updated_at'])

        history = StatusHistory.objects.create(
            application=application,
            status=new_status,
            changed_by=changed_by,
            note=note
        )
        record_admin_change(changed_by, application, 'status_change',
                            {'status': current_status}, {'status': new_status})

        from apps.notifications.services import notify_status_changed
        notify_status_changed(application, history)

    return application

def generate_reference_number():
    """
    Generates a unique reference number NA-YYMMDD-XXXX.
    Uses select_for_update or a raw sequence for concurrency safety.
    """
    date_str = timezone.now().strftime("%y%m%d")
    prefix = f"NA-{date_str}-"

    with transaction.atomic():
        # Using select_for_update to lock a specific counter row would be safer,
        # but for this scaffold, we'll find the max current reference with this prefix
        # and lock those rows.
        last_app = Application.objects.select_for_update().filter(reference_no__startswith=prefix).order_by('-reference_no').first()

        if last_app:
            last_seq = int(last_app.reference_no.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1

        return f"{prefix}{new_seq:04d}"
# SIRI.DEV
