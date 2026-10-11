/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CheckCheck, Copy, Gift, Landmark, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { ApiError, getProfile, updateProfile, type ProfileDetails, type User } from '../auth/api';
import { useAuth } from '../auth/AuthContext';

type Section = 'personal' | 'bank';
type Errors = Record<string, string>;
const card = 'rounded-2xl border border-[#DFE8E2] bg-white shadow-[0_4px_24px_#12352c04]';
const inputStyle = 'mt-2 w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 text-sm text-[#25312E] outline-none transition placeholder:text-[#9AA69F] focus:border-[#00865C] focus:ring-4 focus:ring-[#00865C]/10 disabled:bg-[#F5F7F6] disabled:text-[#7C8981]';

function Field({ label, name, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return <label htmlFor={`profile-${name}`} className="block text-sm font-medium text-[#35483E]">
    {label}<input id={`profile-${name}`} name={name} className={inputStyle} aria-invalid={!!error} aria-describedby={error ? `profile-${name}-error` : undefined} {...props} />
    {error && <span id={`profile-${name}-error`} className="mt-1.5 block text-xs text-red-700">{error}</span>}
  </label>;
}

export function ProfileView() {
  const { user, applyProfile } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [personal, setPersonal] = useState({ full_name: '', phone: '' });
  const [bank, setBank] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState<Section | null>(null);
  const [saved, setSaved] = useState<Section | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [errorSection, setErrorSection] = useState<Section | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const savingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    getProfile().then(data => {
      if (!active) return;
      setProfile(data);
      setPersonal({ full_name: data.full_name || '', phone: data.phone || '' });
      setBank({ bank_name: data.bank_name || '', account_number: data.account_number || '', account_name: data.account_name || '' });
    }).catch(error => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load your profile.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, retry]);
  useEffect(() => { if (Object.keys(errors).length) errorSummary.current?.focus(); }, [errors]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function edit(section: Section, field: string, value: string) {
    if (section === 'personal') setPersonal(current => ({ ...current, [field]: value }));
    else setBank(current => ({ ...current, [field]: value }));
    setSaved(null);
    setErrors(current => { const next = { ...current }; delete next[field]; return next; });
  }
  function reset(section: Section) {
    if (!profile) return;
    if (section === 'personal') setPersonal({ full_name: profile.full_name || '', phone: profile.phone || '' });
    else setBank({ bank_name: profile.bank_name || '', account_number: profile.account_number || '', account_name: profile.account_name || '' });
    setErrors({}); setSaved(null);
  }
  async function save(event: React.FormEvent, section: Section) {
    event.preventDefault();
    if (!profile || savingRef.current) return;
    const values = section === 'personal' ? personal : bank;
    const details = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as Partial<ProfileDetails>;
    if (section === 'personal' && !details.full_name) {
      setErrorSection(section); setErrors({ full_name: 'Enter your full name.' }); return;
    }
    if (section === 'bank' && (!details.bank_name || !details.account_name || !details.account_number)) {
      setErrorSection(section); setErrors({ detail: 'Complete all three bank details before saving.' }); return;
    }
    savingRef.current = true;
    setSaving(section); setSaved(null); setErrors({}); setErrorSection(section);
    try {
      const updated = await updateProfile(details);
      applyProfile(profile.id, updated);
      if (!mounted.current) return;
      setProfile(current => current ? { ...current, ...updated } : current);
      if (section === 'personal') setPersonal({ full_name: updated.full_name, phone: updated.phone });
      else setBank({ bank_name: updated.bank_name, account_number: updated.account_number, account_name: updated.account_name });
      setSaved(section);
    } catch (error) {
      if (!mounted.current) return;
      setErrors(error instanceof ApiError
        ? Object.fromEntries(Object.entries(error.details).map(([field, messages]) => [field, [messages].flat().join(' ')]))
        : { detail: error instanceof Error ? error.message : 'Unable to save. Please try again.' });
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(null);
    }
  }
  async function copyCode() {
    if (!profile?.referral_code) return;
    setCopyError('');
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      if (mounted.current) setCopied(true);
    } catch {
      codeInput.current?.focus(); codeInput.current?.select();
      if (mounted.current) setCopyError('Select and copy the code above. Automatic copying is unavailable in this browser.');
    }
  }
  const header = <header><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A8072]">Your account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#102B23]">My Profile</h1><p className="mt-2 text-sm text-[#687C70]">A little about you. Everything you need in one place.</p></header>;
  if (loading) return <div className="space-y-7">{header}<div role="status" className={`${card} flex items-center gap-3 p-8 text-sm text-[#53645D]`}><LoaderCircle size={18} className="animate-spin" />Loading your profile…</div></div>;
  if (loadError || !profile) return <div className="space-y-7">{header}<div role="alert" className={`${card} p-8`}><p className="text-sm text-red-700">{loadError || 'Your profile could not be loaded.'}</p><button onClick={() => setRetry(n => n + 1)} className="mt-4 text-sm font-semibold text-[#006747] underline">Try again</button></div></div>;
  const initials = profile.full_name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('') || 'NA';
  const bankSaved = !!(profile.bank_name && profile.account_number && profile.account_name);
  const dirty = (section: Section) => Object.entries(section === 'personal' ? personal : bank).some(([key, value]) => value !== (profile[key as keyof User] || ''));
  const feedback = (section: Section) => errorSection === section && Object.keys(errors).length > 0
    ? <div ref={errorSummary} tabIndex={-1} role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 outline-none">{errors.detail || errors.non_field_errors || 'Please check the highlighted fields and try again.'}</div> : null;
  const actions = (section: Section) => <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF1EE] pt-5">
    <span role="status" className="inline-flex items-center gap-1.5 text-xs text-[#006747]">{saved === section ? <><CheckCheck size={15} />{section === 'bank' ? 'Bank details saved' : 'Personal details saved'}</> : dirty(section) ? <span className="text-[#7A827A]">You have unsaved changes</span> : <span className="text-[#7A827A]">{section === 'bank' && !bankSaved ? 'Add your payout account' : 'Your details are up to date'}</span>}</span>
    <div className="flex items-center gap-3"><button type="button" onClick={() => reset(section)} disabled={!!saving || !dirty(section)} className="rounded-lg px-3 py-2.5 text-xs font-medium text-[#53645D] hover:bg-[#F5F7F6] disabled:opacity-40">Cancel</button><button type="submit" disabled={!!saving || !dirty(section)} className="inline-flex items-center gap-2 rounded-xl bg-[#006747] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004D38] disabled:cursor-not-allowed disabled:opacity-40">{saving === section && <LoaderCircle size={15} className="animate-spin" />}{saving === section ? 'Saving…' : 'Save changes'}</button></div>
  </div>;

  return <div className="mx-auto max-w-6xl space-y-7 pb-8">
    {header}
    <section className={`${card} relative overflow-hidden p-5 sm:p-7`} aria-label="Account overview">
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#F1F7F2] to-transparent" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E9F3EC] text-xl font-semibold text-[#006747] ring-4 ring-[#F7FAF8]">{initials}</div><div className="min-w-0"><h2 className="break-words text-xl font-semibold tracking-tight">{profile.full_name || 'Your NameAssist account'}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-[#6A7C70]"><Mail size={13} className="shrink-0" /><span className="break-all">{profile.email}</span></p></div></div>
        <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${profile.email_verified ? 'bg-[#EDF7F0] text-[#006747]' : 'bg-[#FFF8E8] text-[#8B6A18]'}`}><ShieldCheck size={13} />{profile.email_verified ? 'Email verified' : 'Email verification pending'}</span>
      </div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <form onSubmit={event => save(event, 'personal')} className={`${card} p-5 sm:p-7`}>
          <div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-[#F0F6F2] p-2.5 text-[#006747]"><UserRound size={19} /></div><div><h2 className="font-semibold">Personal details</h2><p className="mt-1 text-xs text-[#738277]">Keep your contact information current.</p></div></div>
          {feedback('personal')}
          <fieldset disabled={!!saving} className="space-y-5">
            <Field label="Full name" name="full_name" autoComplete="name" value={personal.full_name} onChange={e => edit('personal', 'full_name', e.target.value)} maxLength={255} required error={errorSection === 'personal' ? errors.full_name : undefined} />
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Phone number" name="phone" type="tel" autoComplete="tel" placeholder="e.g. +234 801 234 5678" value={personal.phone} onChange={e => edit('personal', 'phone', e.target.value)} maxLength={50} error={errorSection === 'personal' ? errors.phone : undefined} /><div><Field label="Email address" name="email" value={profile.email} readOnly className={`${inputStyle} !bg-[#F7F9F7] !text-[#7C8981]`} /><p className="mt-2 flex items-center gap-1 text-[11px] text-[#87958C]"><LockKeyhole size={11} />Your account sign-in address</p></div></div>
          </fieldset>
          {actions('personal')}
        </form>

        <form onSubmit={event => save(event, 'bank')} className={`${card} p-5 sm:p-7`}>
          <div className="mb-6 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-[#F0F6F2] p-2.5 text-[#006747]"><Landmark size={19} /></div><div><h2 className="font-semibold">Bank details</h2><p className="mt-1 text-xs text-[#738277]">The account to use for your referral payouts.</p></div></div>{bankSaved && <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F6F2] px-2 py-1 text-[10px] font-medium text-[#52765D]"><Check size={11} />Saved</span>}</div>
          {feedback('bank')}
          <fieldset disabled={!!saving} className="space-y-5">
            <Field label="Bank name" name="bank_name" placeholder="Enter your bank name" value={bank.bank_name} onChange={e => edit('bank', 'bank_name', e.target.value)} maxLength={255} required error={errorSection === 'bank' ? errors.bank_name : undefined} />
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Account number" name="account_number" inputMode="numeric" pattern="[0-9]+" title="Enter digits only." placeholder="Enter account number" value={bank.account_number} onChange={e => edit('bank', 'account_number', e.target.value)} maxLength={50} required error={errorSection === 'bank' ? errors.account_number : undefined} /><Field label="Account holder’s name" name="account_name" placeholder="As it appears at your bank" value={bank.account_name} onChange={e => edit('bank', 'account_name', e.target.value)} maxLength={255} required error={errorSection === 'bank' ? errors.account_name : undefined} /></div>
          </fieldset>
          <p className="mt-5 rounded-xl bg-[#F7F9F7] px-4 py-3 text-xs leading-relaxed text-[#6A7C70]">Check your account number and account name carefully before saving. These details will be used when a referral reward is paid.</p>
          {actions('bank')}
        </form>
      </div>

      <aside className="space-y-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#003D35] p-6 text-white sm:p-7" aria-labelledby="referral-title">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border-[28px] border-white/[0.04]" aria-hidden="true" />
          <div className="relative"><div className="mb-7 flex items-center justify-between"><span className="rounded-xl bg-white/10 p-2.5 text-[#E0BD60]"><Gift size={22} /></span><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ADD0BC]">Better together</span></div>
            <h2 id="referral-title" className="text-2xl font-semibold tracking-tight !text-white">Good things<br />are worth sharing.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#BCD5C8]">Know someone starting their documentation journey? Share your referral code with them.</p>
            <div className="mt-7 rounded-xl border border-white/15 bg-white/[0.06] p-4"><label htmlFor="referral-code" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A9CABB]">Your referral code</label><input ref={codeInput} id="referral-code" aria-label="Your referral code" readOnly value={profile.referral_code || 'Not available yet'} onFocus={e => e.target.select()} className={`mt-2 w-full min-w-0 bg-transparent font-semibold text-white outline-none ${profile.referral_code ? 'text-2xl tracking-[0.12em]' : 'text-sm'}`} /></div>
            <button type="button" onClick={copyCode} disabled={!profile.referral_code} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E2BD5B] px-4 py-3 text-sm font-semibold text-[#173F30] transition hover:bg-[#ECCC7A] disabled:cursor-not-allowed disabled:opacity-50">{copied ? <CheckCheck size={16} /> : <Copy size={16} />}{copied ? 'Code copied' : 'Copy referral code'}</button>
            <p role="status" className="mt-3 text-xs leading-relaxed text-[#BCD5C8]">{copyError || (copied ? 'Ready to share with someone you know.' : !profile.referral_code ? 'Your referral code is not available yet. Contact support if this continues.' : 'They can use this code when creating their account.')}</p>
          </div>
        </section>
        <section className="rounded-2xl border border-[#E2E9E3] bg-[#EFF5F0] p-5"><h3 className="text-sm font-semibold">A quick account check</h3><ul className="mt-4 space-y-3 text-xs text-[#587060]">{[[true, 'Personal profile created'], [profile.email_verified, 'Email address verified'], [bankSaved, 'Payout details added']].map(([done, label]) => <li key={String(label)} className="flex items-center gap-2.5"><span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? 'bg-[#D6EADC] text-[#006747]' : 'border border-[#BDCEC1]'}`}>{done && <Check size={10} />}</span>{label}</li>)}</ul><a href="#/dashboard/support" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#006747]">Need help with your account?<ArrowUpRight size={13} /></a></section>
      </aside>
    </div>
  </div>;
}
