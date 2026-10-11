"""Reserve checkout locally; trust only a server-verified gateway transaction."""
import re
import uuid
from datetime import timedelta
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, PermissionDenied
from apps.applications.models import Application, StatusHistory
from .models import Payment


class GatewayUnavailable(APIException):
    status_code = 503
    default_detail = 'Payment provider is unavailable. Your application is saved; please retry shortly.'


class PaymentConflict(APIException):
    status_code = 409
    default_detail = 'Checkout is being prepared. Please retry shortly.'


def payment_domain():
    return 'live' if settings.PAYSTACK_SECRET_KEY.startswith('sk_live_') else 'test'


def confirmed_payments(application):
    return application.payments.filter(status='success', verified_at__isnull=False, gateway_mode=payment_domain())


def get_paystack_headers():
    if not settings.PAYSTACK_SECRET_KEY:
        raise GatewayUnavailable('Payments are not configured yet. Please try again later.')
    return {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}', 'Content-Type': 'application/json'}


def gateway_request(method, path, **kwargs):
    try:
        response = getattr(requests, method)(
            f'https://api.paystack.co/transaction/{path}', headers=get_paystack_headers(),
            timeout=(3, 12), allow_redirects=False, **kwargs)
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or result.get('status') is not True or not isinstance(result.get('data'), dict):
            raise GatewayUnavailable()
        return result['data']
    except (requests.RequestException, ValueError):
        raise GatewayUnavailable() from None


def callback_url(reference=None):
    url = settings.PAYSTACK_CALLBACK_URL
    parsed = urlsplit(url)
    if (parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in ('localhost', '127.0.0.1'))
            or not parsed.hostname or parsed.username or parsed.password or parsed.fragment):
        raise GatewayUnavailable('Payment callback is not configured correctly.')
    if reference:
        query = dict(parse_qsl(parsed.query))
        query.update(payment='cancelled', reference=reference)
        return urlunsplit(parsed._replace(query=urlencode(query)))
    return url


def initialize_payment(application, user, amount=None):
    # The optional legacy argument is intentionally ignored: pricing is server-owned.
    get_paystack_headers()
    callback = callback_url()
    if application.user_id != user.pk:
        raise PermissionDenied()
    # Old checkouts have no saved URL or verification timestamp. Reconcile them
    # before offering another charge, never assume their old success flag is proof.
    legacy_attempts = Payment.objects.filter(application=application, status__in=['pending', 'success'],
                                    gateway_mode='', verified_at__isnull=True, checkout_url='')
    for legacy in legacy_attempts:
        if not legacy.gateway_reference:
            raise PaymentConflict('An earlier payment needs review. Please contact support before paying again.')
        reconciled = verify_payment(legacy.gateway_reference)
        if reconciled.status == 'success' and reconciled.verified_at:
            return None, reconciled.gateway_reference
        if reconciled.status not in ('failed', 'refunded'):
            raise PaymentConflict('An earlier checkout is still pending. Please contact support with its reference before paying again.')
    with transaction.atomic():
        app = Application.objects.select_for_update().select_related('service').get(pk=application.pk)
        if app.user_id != user.pk:
            raise PermissionDenied()
        attempts = Payment.objects.filter(application=app, gateway_mode=payment_domain()).order_by('-created_at')
        paid = attempts.filter(status='success', verified_at__isnull=False).first()
        if paid:
            return None, paid.gateway_reference
        pending = attempts.filter(status='pending').exclude(checkout_url='').first()
        if pending:
            return pending.checkout_url, pending.gateway_reference
        preparing = attempts.filter(status='initializing').first()
        if preparing and preparing.updated_at > timezone.now() - timedelta(seconds=45):
            raise PaymentConflict()
        attempts.filter(status='initializing').update(status='initialization_failed', updated_at=timezone.now())
        if app.payment_amount is None:
            app.payment_amount = app.service.base_price
            app.save(update_fields=['payment_amount', 'updated_at'])
        if app.payment_amount <= 0:
            raise GatewayUnavailable('The application fee has not been configured. Please contact support.')
        payment = Payment.objects.create(application=app, user=user, amount=app.payment_amount,
            payer_email=user.email, gateway_mode=payment_domain(), currency='NGN', status='initializing', gateway_reference=f'NA-PAY-{uuid.uuid4().hex}')
    payload = {'email': payment.payer_email, 'amount': int(payment.amount * 100), 'currency': payment.currency,
        'reference': payment.gateway_reference, 'callback_url': callback,
        'metadata': {'application_id': str(app.pk), 'user_id': str(user.pk), 'cancel_action': callback_url(payment.gateway_reference)}}
    try:
        data = gateway_request('post', 'initialize', json=payload)
        url = data.get('authorization_url', '')
        parsed = urlsplit(url) if isinstance(url, str) else None
        if (data.get('reference') != payment.gateway_reference or not parsed or parsed.scheme != 'https'
                or parsed.netloc != 'checkout.paystack.com' or len(url) > 500):
            raise GatewayUnavailable()
        with transaction.atomic():
            Application.objects.select_for_update().get(pk=app.pk)
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            if payment.status == 'success' and payment.verified_at:
                return None, payment.gateway_reference
            if payment.status != 'initializing':
                raise PaymentConflict()
            payment.status, payment.checkout_url = 'pending', url
            payment.save(update_fields=['status', 'checkout_url', 'updated_at'])
        return url, payment.gateway_reference
    except (GatewayUnavailable, ValueError):
        Payment.objects.filter(pk=payment.pk, status='initializing').update(status='initialization_failed', updated_at=timezone.now())
        raise GatewayUnavailable() from None


def verify_payment(reference):
    payment = Payment.objects.select_related('user').get(gateway_reference=reference)
    if payment.gateway_mode and payment.gateway_mode != payment_domain():
        raise PaymentConflict('This payment belongs to a different payment environment. Open your application to continue.')
    if (payment.status == 'success' and payment.verified_at) or payment.status == 'refunded':
        return payment
    if not isinstance(reference, str) or not re.fullmatch(r'[A-Za-z0-9_.=-]{1,100}', reference):
        raise GatewayUnavailable()
    data = gateway_request('get', f'verify/{reference}')
    if data.get('reference') != reference:
        raise GatewayUnavailable()
    if data.get('status') not in ('success', 'failed', 'abandoned', 'reversed', 'pending', 'ongoing', 'processing', 'queued'):
        raise GatewayUnavailable()
    if data.get('status') == 'success':
        metadata = data.get('metadata')
        customer = data.get('customer')
        expected_domain = payment_domain()
        if (data.get('reference') != reference or type(data.get('amount')) is not int
                or data['amount'] != int(payment.amount * 100) or data.get('currency') != payment.currency
                or not isinstance(customer, dict) or not isinstance(customer.get('email'), str) or customer['email'].lower() != (payment.payer_email or payment.user.email).lower()
                or not isinstance(metadata, dict) or metadata.get('application_id') != str(payment.application_id)
                or metadata.get('user_id') != str(payment.user_id) or data.get('domain') != expected_domain):
            raise GatewayUnavailable('Payment details could not be confirmed. Please contact support with your reference.')
    with transaction.atomic():
        app = Application.objects.select_for_update().get(pk=payment.application_id)
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if (payment.status == 'success' and payment.verified_at) or payment.status == 'refunded':
            return payment
        if data.get('status') == 'success':
            payment.status, payment.verified_at = 'success', timezone.now()
            payment.gateway_mode = payment_domain()
            if app.payment_amount is None:
                app.payment_amount = payment.amount
                app.save(update_fields=['payment_amount', 'updated_at'])
            StatusHistory.objects.create(application=app, status=app.status,
                note=f'Payment confirmed: {reference}.')
        elif data.get('status') in ('failed', 'abandoned', 'reversed'):
            payment.status = 'failed'
        elif payment.status != 'initializing':
            payment.status = 'pending'
        payment.save(update_fields=['status', 'verified_at', 'gateway_mode', 'updated_at'])
        if payment.status == 'success' and payment.verified_at:
            from apps.notifications.services import notify_payment_confirmed
            notify_payment_confirmed(payment)
    return payment

def disburse_referral_reward(reward_id, admin_user, *, amount, payment_reference, bank_details, note=''):
    """Record an admin-confirmed manual transfer; never initiate a bank transfer."""
    from decimal import Decimal, InvalidOperation
    from django.db import IntegrityError
    from apps.accounts.models import User
    from .models import ReferralReward
    from apps.core.services import record_admin_change

    if not admin_user or not admin_user.is_active or admin_user.role != 'admin':
        raise PermissionDenied('Admin access required.')
    try:
        amount = Decimal(str(amount))
        if not amount.is_finite() or amount < Decimal('0.01') or amount > Decimal('99999999.99') or amount != amount.quantize(Decimal('0.01')):
            raise ValueError('Enter a positive amount with at most two decimal places.')
    except (InvalidOperation, TypeError):
        raise ValueError('Enter a valid payment amount.') from None
    payment_reference = payment_reference.strip()
    if not payment_reference or len(payment_reference) > 100:
        raise ValueError('Enter a payment reference of at most 100 characters.')
    if not all(isinstance(bank_details.get(field), str) and bank_details[field].strip() for field in ('bank_name', 'account_number', 'account_name')):
        raise ValueError('Confirm the bank details used for this manual payment.')
    try:
        with transaction.atomic():
            reward = ReferralReward.objects.select_for_update().get(pk=reward_id)
            if reward.status != 'pending':
                raise ValueError('This reward has already been recorded. Refresh the referral history.')
            referrer = User.objects.select_for_update().get(pk=reward.referrer_id)
            if not all(value.strip() for value in (referrer.bank_name, referrer.account_number, referrer.account_name)):
                raise ValueError('Referrer has not provided complete bank details.')
            if ReferralReward.objects.filter(gateway_reference=payment_reference).exists():
                raise ValueError('This payment reference is already recorded for another reward.')
            before = {'status': reward.status, 'amount': f'{reward.amount:.2f}'}
            reward.amount = amount
            reward.status = 'paid'
            reward.payment_method = 'manual'
            reward.disbursed_at = timezone.now()
            reward.gateway_reference = payment_reference
            reward.save(update_fields=['amount', 'status', 'payment_method', 'disbursed_at', 'gateway_reference', 'updated_at'])
            record_admin_change(admin_user, reward, 'record_referral_payment', before, {
                'status': 'paid', 'amount': f'{amount:.2f}', 'currency': 'NGN', 'payment_method': 'manual',
                'payment_reference': payment_reference, 'note': note,
                # Preserve the destination explicitly confirmed by the operator, even if
                # the customer edited their profile after that transfer.
                'bank_name': bank_details['bank_name'], 'account_number': bank_details['account_number'],
                'account_name': bank_details['account_name'],
            })
            return reward
    except IntegrityError:
        raise ValueError('This payment reference is already recorded. Refresh and check the referral history.') from None
# SIRI.DEV
