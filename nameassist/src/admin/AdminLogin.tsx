/* SIRI.DEV */
import React, { useState } from 'react';
import { ShieldCheck, UserCheck, ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { adminLogin } from './api';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); if (isSubmitting) return;
    setIsSubmitting(true); setError('');
    try { await adminLogin(email.trim(), password, otp); window.location.hash = '#/admin'; }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to sign in.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] px-4 py-12 text-[#293B35] flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <a
            href="#hero"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006747] hover:text-[#12352C] transition"
          >
            <ArrowLeft size={14} />
            Back to Public Portal
          </a>
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#EDF7F2] text-[#006747] px-2.5 py-1 rounded-full">
            <ShieldCheck size={13} />
            Secure Operations Gateway
          </span>
        </div>

        <section className="rounded-2xl border border-[#DCEBE2] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EDF3F0] pb-6">
            <div>
              <img src="/assets/nameassist-logo.png" alt="NameAssist Legal" className="h-8 w-auto" />
              <p className="mt-2 text-xs uppercase tracking-widest font-semibold text-[#006747]">
                Internal Legal & Registry Operations
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#12352C] flex items-center justify-center text-white font-serif font-bold text-sm">
              NA
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-serif font-semibold text-[#12352C]">Staff & Registrar Sign In</h1>
            <p className="mt-1 text-sm text-[#53645D]">
              Authorized legal officers, commissioners for oaths, and case managers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-[#293B35]">
                Officer Work Email
              </label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3.5 top-3 text-[#53645D]/60" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-sm focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none"
                  placeholder="officer@nameassist.ng"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-[#293B35]">
                Secret Password
              </label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3.5 top-3 text-[#53645D]/60" />
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-sm focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="admin-otp" className="block text-xs font-medium text-[#293B35]">
                  Authenticator OTP Code (Hardware Token / Google Authenticator)
                </label>
                <span className="text-[11px] text-[#006747] font-mono font-medium">Six-digit code</span>
              </div>
              <div className="relative mt-1">
                <KeyRound size={16} className="absolute left-3.5 top-3 text-[#53645D]/60" />
                <input
                  id="admin-otp"
                  name="otp"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full rounded-lg border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none"
                />
              </div>
            </div>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 rounded-lg bg-[#006747] hover:bg-[#12352C] transition py-3 font-semibold text-sm text-white shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating Officer Credentials…' : 'Access Admin Workspace'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EDF3F0] text-center">
            <p className="text-xs text-[#53645D]">
              Authorized staff access only. Sign in with your staff password and current authenticator code.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
