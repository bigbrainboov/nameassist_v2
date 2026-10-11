/* SIRI.DEV */
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { resendVerification } from './api';

export function VerificationNotice() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!user || user.email_verified) return null;
  async function resend() {
    if (busy) return;
    setBusy(true);
    try { setMessage((await resendVerification()).message); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to send. Please try again.'); }
    finally { setBusy(false); }
  }
  return <aside className="mb-5 rounded-lg border border-[#D8AD35]/50 bg-[#FFFCF2] p-4 text-sm text-[#25312E]">
    <p>Please verify your email address. Check your inbox for the verification link.</p>
    <button type="button" onClick={resend} disabled={busy} className="mt-2 font-semibold text-[#003D35] underline disabled:opacity-60">{busy ? 'Sending…' : 'Resend verification email'}</button>
    {message && <p role="status" className="mt-2">{message}</p>}
  </aside>;
}
