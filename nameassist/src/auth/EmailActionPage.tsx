/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import { ApiError, confirmPasswordReset, requestPasswordReset, verifyEmail } from './api';
import { useAuth } from './AuthContext';
import { submitPasswordReset } from './emailActions';
import type { EmailAction } from './emailActions';

export function EmailActionPage({ initial }: { initial: EmailAction }) {
  // The token lives only in memory. Strip it before external links or analytics can read it.
  const [token] = useState(initial.token);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser, clearSession } = useAuth();
  const action = initial.action;
  const forgot = action === 'forgot-password';
  const verifying = action === 'verify-email';
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}#/${action}`);
  }, [action]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get('password') || '');
    if (!forgot && !verifying && password !== fields.get('confirmation')) {
      setError('Passwords do not match.'); return;
    }
    setBusy(true); setError('');
    try {
      if (forgot) await requestPasswordReset(String(fields.get('email')).trim());
      else if (verifying) {
        await verifyEmail(token);
        // Verification succeeded even if refreshing an old session fails.
        await refreshUser().catch(() => {});
      } else await submitPasswordReset(token, password, confirmPasswordReset, clearSession);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) setError(Object.values(err.details).flat().join(' ') || err.message);
      else setError(err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }
  const title = forgot ? 'Forgot your password?' : verifying ? 'Verify your email' : 'Choose a new password';
  const inputClass = 'mt-2 w-full rounded-lg border border-[#CCDAD2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#009B6B]';
  return <main className="min-h-screen bg-[#F5F7F6] px-5 py-12 text-[#25312E]">
    <section className="mx-auto max-w-lg rounded-2xl border border-[#E3EAE6] bg-white p-8 sm:p-10">
      <a href="#hero"><img src="/assets/nameassist-logo.png" alt="NameAssist" className="mb-8 w-44" /></a>
      <h1 className="text-2xl font-semibold text-[#003D35]">{done ? (verifying ? 'Email verified' : forgot ? 'Check your inbox' : 'Password updated') : title}</h1>
      {done ? <div role="status" className="mt-5 space-y-5 leading-relaxed">
        <p>{forgot ? 'If an account with that email exists, you will receive a password-reset link. The link expires in one hour.' : verifying ? 'Your email address has been confirmed. You can continue with your documentation journey.' : 'Your password has been changed. Log in with your new password.'}</p>
        <a href={verifying ? '#/dashboard' : '#/login'} className="inline-block rounded-lg bg-[#003D35] px-5 py-3 font-semibold text-white">{verifying ? 'Open dashboard' : 'Back to login'}</a>
      </div> : !forgot && !token ? <div className="mt-5 space-y-4">
        <p role="alert">This link is missing its security token. Open the link from your email again or request a new one.</p>
        <a className="text-[#003D35] underline" href={verifying ? '#/dashboard' : '#/forgot-password'}>{verifying ? 'Sign in to resend verification' : 'Request a new reset link'}</a>
      </div> : <form onSubmit={submit} className="mt-5 space-y-5">
        <p className="leading-relaxed">{forgot ? 'Enter your account email and we will send you a secure reset link.' : verifying ? 'Confirm that this email address belongs to you.' : 'Use a strong password you have not used elsewhere.'}</p>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}{!forgot && <p className="mt-2"><a href={verifying ? '#/dashboard' : '#/forgot-password'} className="underline">Request a new link</a></p>}</div>}
        {forgot && <label className="block text-sm font-medium">Email address<input type="email" name="email" autoComplete="email" required disabled={busy} className={inputClass} /></label>}
        {!forgot && !verifying && <>
          <label className="block text-sm font-medium">New password<input type="password" name="password" autoComplete="new-password" minLength={8} required disabled={busy} className={inputClass} /></label>
          <label className="block text-sm font-medium">Confirm new password<input type="password" name="confirmation" autoComplete="new-password" minLength={8} required disabled={busy} className={inputClass} /></label>
        </>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-[#003D35] px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Please wait…' : forgot ? 'Send reset link' : verifying ? 'Verify email' : 'Update password'}</button>
      </form>}
    </section>
  </main>;
}
