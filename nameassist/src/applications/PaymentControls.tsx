/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { type ApplicationRecord } from './api';
import { beginCheckout, money, paymentReturn, verifyPayment } from './payment';

const button = 'rounded-lg bg-[#006747] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';

export function PaymentControls({ application, onUpdated }: { application: ApplicationRecord; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const running = useRef(false);
  const paid = confirmed || application.payment.status === 'paid';
  async function act(check: boolean) {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      if (check && application.payment.reference) {
        const payment = await verifyPayment(application.payment.reference);
        const success = payment.status === 'success' && !!payment.verified_at;
        setConfirmed(success);
        setMessage(success ? 'Payment confirmed. Thank you.' : 'Payment is not confirmed yet. If you were debited, check again shortly before paying again.');
        onUpdated();
      } else if (await beginCheckout(application.id)) {
        setConfirmed(true); onUpdated();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to confirm payment. Please retry.'); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="my-4 rounded-xl border border-[#CCE3D5] bg-[#F5FBF7] p-4 text-left">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs text-[#53645D]">Application fee</p><p className="font-semibold">{money(application.payment.amount)} <span className="ml-2 text-xs font-normal">{paid ? 'Paid' : 'Payment due'}</span></p></div>
      {!paid && <div className="flex flex-wrap items-center gap-3">
        {application.payment.reference && <button type="button" disabled={busy} onClick={() => act(true)} className="text-sm text-[#006747] underline disabled:opacity-50">Check payment</button>}
        <button type="button" disabled={busy || Number(application.payment.amount) <= 0} onClick={() => act(false)} className={button}>{busy ? 'Please wait…' : application.payment.reference ? 'Continue payment' : 'Pay with Paystack'}</button>
      </div>}
    </div>
    {!paid && <p className="mt-2 text-xs text-[#53645D]">Your application is saved. Complete payment to begin review. You’ll pay securely on Paystack.</p>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}

export function PaymentReturn({ onUpdated }: { onUpdated: () => void }) {
  const [returned] = useState(() => paymentReturn(window.location.search));
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Checking your payment…');
  const [confirmed, setConfirmed] = useState(false);
  const [retry, setRetry] = useState(0);
  const update = useRef(onUpdated);
  update.current = onUpdated;
  useEffect(() => {
    if (!returned) return;
    if (!returned.reference) { setMessage('The payment reference is missing. Open your application below to check or continue payment.'); return; }
    let active = true;
    setBusy(true);
    verifyPayment(returned.reference).then(payment => {
      if (!active) return;
      const paid = payment.status === 'success' && !!payment.verified_at;
      setConfirmed(paid);
      setMessage(paid ? 'Payment confirmed. Your application is ready for review.' : returned.cancelled
        ? 'Checkout was closed. Your application is saved, and you can continue payment below.'
        : 'Payment is not confirmed yet. If you were debited, check again shortly before paying again.');
      update.current();
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to check payment. Please retry.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [returned, retry]);
  if (!returned || dismissed) return null;
  function dismiss() {
    const url = new URL(window.location.href);
    ['payment', 'reference', 'trxref'].forEach(key => url.searchParams.delete(key));
    if (!url.hash) url.hash = '#/dashboard/payments';
    window.history.replaceState(null, '', url);
    setDismissed(true);
  }
  return <section role="status" className="mb-6 rounded-xl border border-[#A9D8C0] bg-[#EDF7F2] p-5">
    <h2 className="font-semibold">{confirmed ? 'Thank you for your payment' : 'Payment update'}</h2>
    <p className="mt-2 text-sm">{busy ? 'Checking your payment…' : message}</p>
    {returned.reference && <p className="mt-2 break-all font-mono text-xs">{returned.reference}</p>}
    <div className="mt-3 flex gap-4">{!confirmed && returned.reference && <button disabled={busy} onClick={() => setRetry(n => n + 1)} className={button}>Check again</button>}
      <button disabled={busy} onClick={dismiss} className="text-sm underline">Dismiss</button></div>
  </section>;
}
