/* SIRI.DEV */
import { authenticatedRequest } from '../auth/api';
import { type PaymentRecord } from './api';

export const money = (amount: string) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(amount));
export function checkoutUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.host !== 'checkout.paystack.com' || url.username || url.password) {
    throw new Error('Unable to open this checkout. Please contact support.');
  }
  return url.href;
}
export function paymentReturn(search: string) {
  const query = new URLSearchParams(search);
  const mode = query.get('payment');
  if (mode !== 'return' && mode !== 'cancelled') return null;
  const reference = query.get('reference') || query.get('trxref');
  return { cancelled: mode === 'cancelled', reference: reference && /^[A-Za-z0-9_.=-]{1,100}$/.test(reference) ? reference : null };
}
export const verifyPayment = (reference: string) => authenticatedRequest<PaymentRecord>('/payments/verify/', { reference });
export async function beginCheckout(applicationId: string) {
  const result = await authenticatedRequest<{ authorization_url: string | null; reference: string; paid: boolean }>(
    '/payments/initialize/', { application_id: applicationId });
  if (result.paid) return true;
  if (!result.authorization_url) throw new Error('Checkout is unavailable. Please retry.');
  window.location.assign(checkoutUrl(result.authorization_url));
  return false;
}
