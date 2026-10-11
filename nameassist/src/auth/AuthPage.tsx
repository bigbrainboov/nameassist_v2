/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { ApiError, login, signup, googleLogin } from './api';
import { useGoogleLogin, type TokenResponse } from '@react-oauth/google';
import { useAuth } from './AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const creating = mode === 'signup';
  const googleEnabled = !!import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim();
  const handleGoogleSuccess = async (tokenResponse: TokenResponse) => {
    if (busy) return;
    setBusy(true); setErrors({});
    try {
      const result = await googleLogin({ id_token: tokenResponse.access_token });
      completeAuth(result);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setErrors(err instanceof ApiError ? err.details : { detail: err instanceof Error ? err.message : 'Google authentication failed.' });
    } finally { setBusy(false); }
  };

  const { completeAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (Object.keys(errors).length) errorRef.current?.focus(); }, [errors]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email')).trim();
    const password = String(fields.get('password'));
    if (creating && password !== fields.get('confirm_password')) {
      setErrors({ confirm_password: 'Passwords do not match.' }); return;
    }
    setBusy(true); setErrors({});
    try {
      const result = creating
        ? await signup({ email, password, full_name: String(fields.get('full_name')).trim() })
        : await login({ email, password });
      completeAuth(result);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setErrors(err instanceof ApiError ? err.details : { detail: err instanceof Error ? err.message : 'Please try again.' });
    } finally { setBusy(false); }
  }
  const inputClass = 'mt-2 w-full rounded-lg border border-[#CCDAD2] bg-white px-4 py-3 text-base outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20 disabled:opacity-60';
  const fieldError = (name: string) => errors[name] ? <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{[errors[name]].flat().join(' ')}</p> : null;
  return <main className="min-h-screen bg-[#F7FAF8] text-[#293B35] px-5 py-8 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <a href="#hero" className="inline-flex items-center gap-2 text-sm text-[#006747]"><ArrowLeft size={16} /> Back to home</a>
      <div className="mt-8 grid overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-flat lg:grid-cols-2">
        <aside className="bg-[#12352C] p-8 text-white sm:p-12 flex flex-col justify-between">
          <div><img src="/assets/nameassist-logo.png" alt="NameAssist" className="w-48 rounded-lg bg-white p-3" />
            <p className="mt-12 text-xs uppercase tracking-[0.2em] text-[#A9D8C0]">Change. Correct. Simplify.</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold !text-white leading-tight">Your next chapter<br />starts here.</h1>
            <p className="mt-5 max-w-sm text-[#D1E5DA]">A simpler way to manage your name and documentation journey.</p>
          </div>
          <p className="mt-10 text-sm text-[#A9D8C0]">NameAssist · With you, every step.</p>
        </aside>
        <section className="p-7 sm:p-12" aria-labelledby="auth-title">
          <h2 id="auth-title" className="text-2xl font-semibold">{creating ? 'Create your account' : 'Welcome back'}</h2>
          <p className="mt-2 mb-7 text-sm text-[#53645D]">{creating ? 'Enter your details to get started.' : 'Log in with your email and password.'}</p>
          {Object.keys(errors).length > 0 && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {errors.detail || errors.non_field_errors ? [errors.detail || errors.non_field_errors].flat().join(' ') : 'Please check the highlighted fields below.'}
          </div>}

          {googleEnabled && <div className="mt-5 mb-5 flex flex-col space-y-3">
            <GoogleAuthButton
              creating={creating}
              busy={busy}
              onSuccess={handleGoogleSuccess}
              onError={() => setErrors({ detail: 'Google authentication was cancelled or failed.' })}
            />
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#DCEBE2]"></div>
              <span className="mx-4 shrink-0 text-sm text-[#53645D]">or</span>
              <div className="flex-grow border-t border-[#DCEBE2]"></div>
            </div>
          </div>}
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={busy} className="space-y-5">
              {creating && <div><label htmlFor="full_name" className="text-sm font-medium">Full name</label><input id="full_name" name="full_name" autoComplete="name" required maxLength={255} className={inputClass} aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? 'full_name-error' : undefined} />{fieldError('full_name')}</div>}
              <div><label htmlFor="email" className="text-sm font-medium">Email address</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />{fieldError('email')}</div>
              <div><label htmlFor="password" className="text-sm font-medium">Password</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} required minLength={creating ? 8 : undefined} className={`${inputClass} pr-12`} aria-invalid={!!errors.password} aria-describedby={creating ? 'password-help password-error' : errors.password ? 'password-error' : undefined} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-5 p-1 text-[#53645D]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{creating && <p id="password-help" className="mt-2 text-xs text-[#53645D]">Use at least 8 characters. Avoid common passwords or personal details.</p>}{fieldError('password')}</div>
              {creating && <div><label htmlFor="confirm_password" className="text-sm font-medium">Confirm password</label><input id="confirm_password" name="confirm_password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required className={inputClass} aria-invalid={!!errors.confirm_password} aria-describedby={errors.confirm_password ? 'confirm_password-error' : undefined} />{fieldError('confirm_password')}</div>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006747] py-3 font-medium text-white hover:bg-[#0b4834] disabled:opacity-60">{busy ? <><LoaderCircle size={18} className="animate-spin" /> Please wait…</> : <>{creating ? 'Create account' : 'Log in'}<ArrowRight size={18} /></>}</button>
            </fieldset>
          </form>
          {!creating && <p className="mt-4 text-sm"><a href="#/forgot-password" className="text-[#006747] underline">Forgot your password?</a></p>}
          <p className="mt-7 text-center text-sm text-[#53645D]">{creating ? 'Already have an account?' : 'New to NameAssist?'}{' '}<a href={creating ? '#/login' : '#/signup'} className="font-semibold text-[#006747] underline underline-offset-4">{creating ? 'Log in' : 'Create an account'}</a></p>
        </section>
      </div>
    </div>
  </main>;
}

// Mount the OAuth hook only when Google sign-in is configured.
function GoogleAuthButton({ creating, busy, onSuccess, onError }: {
  creating: boolean;
  busy: boolean;
  onSuccess: (response: TokenResponse) => void;
  onError: () => void;
}) {
  const loginWithGoogle = useGoogleLogin({ onSuccess, onError, onNonOAuthError: onError });
  return (
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#CCDAD2] bg-white py-3 font-medium text-[#293B35] transition hover:bg-[#F7FAF8] disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              {creating ? 'Sign up with Google' : 'Log in with Google'}
            </button>
  );
}
