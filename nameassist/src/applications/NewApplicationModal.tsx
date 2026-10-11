/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, LoaderCircle, Upload } from 'lucide-react';
import { SERVICES } from '../data';
import { useAuth } from '../auth/AuthContext';
import { ApiError, authenticatedRequest } from '../auth/api';
import { Dialog } from '../components/Dialog';
import { DocumentPreviewCard } from './DocumentPreviewCard';
import { type ApplicationRecord, type IntakeOptions } from './api';
import { PaymentControls } from './PaymentControls';
import { money } from './payment';

const inputClass = 'mt-1.5 w-full rounded-lg border border-[#CCDAD2] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006747]/30';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00513B] disabled:opacity-50 disabled:cursor-not-allowed';
const steps = ['Your details', 'Documents', 'Newspaper', 'Review'];

export function NewApplicationModal({ onClose, onSubmitted, preferredService }: {
  onClose: () => void; onSubmitted: () => void; preferredService?: string;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<IntakeOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, unknown>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<ApplicationRecord | null>(null);
  const [values, setValues] = useState<Record<string, string>>({
    former_title: '', former_first_name: '', former_middle_name: '', former_last_name: '',
    new_title: '', new_first_name: '', new_middle_name: '', new_last_name: '',
    email: user?.email || '', phone: user?.phone || '', newspaper: '',
  });
  const [uploads, setUploads] = useState<Record<string, File[]>>({});
  useEffect(() => {
    let active = true;
    setOptionsError('');
    authenticatedRequest<IntakeOptions>('/applications/options/').then(data => { if (active) setOptions(data); })
      .catch(error => { if (active) setOptionsError(error.message); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => { if (Object.keys(errors).length) errorRef.current?.focus(); }, [errors]);
  const change = (key: string, value: string) => setValues(old => ({ ...old, [key]: value }));
  const newspaper = options?.newspapers.find(paper => paper.slug === values.newspaper);
  const fullName = (prefix: string) => ['title', 'first_name', 'middle_name', 'last_name'].map(part => values[`${prefix}_${part}`]).filter(Boolean).join(' ');

  function addFiles(kind: string, files: FileList | null) {
    if (!files || !options) return;
    const selected = Array.from(files);
    if (selected.some(file => file.size === 0 || file.size > options.max_file_size || !/\.(pdf|jpe?g|png)$/i.test(file.name))) {
      setErrors({ documents: 'Choose non-empty PDF, JPG or PNG files, up to 10 MB each.' }); return;
    }
    const next = { ...uploads, [kind]: kind === 'affidavit' ? selected.slice(0, 1) : [...(uploads[kind] || []), ...selected] };
    if (Object.values(next).flat().length > options.max_files) {
      setErrors({ documents: `You can upload up to ${options.max_files} files in total.` }); return;
    }
    setUploads(next); setErrors({});
  }

  async function advance(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setErrors({});
    if (step === 1 && (!/^\+?[0-9 ()-]{7,30}$/.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7)) { setErrors({ phone: 'Enter a valid phone number.' }); return; }
    if (step === 2 && !uploads.affidavit?.length) { setErrors({ affidavit: 'Please upload your sworn affidavit.' }); return; }
    if (step === 3 && !newspaper) { setErrors({ newspaper: 'Select an available newspaper.' }); return; }
    if (step < 4) { setStep(step + 1); return; }
    setBusy(true);
    const data = new FormData();
    data.append('submission_id', submissionId);
    Object.entries(values).forEach(([key, value]) => data.append(key, value.trim()));
    Object.entries(uploads).forEach(([key, files]) => files.forEach(file => data.append(key, file)));
    try {
      const saved = await authenticatedRequest<ApplicationRecord>('/applications/change-of-name/', data);
      setResult(saved); onSubmitted();
    } catch (error) {
      setErrors(error instanceof ApiError ? error.details : { detail: error instanceof Error ? error.message : 'Unable to submit. Please retry.' });
      if (error instanceof ApiError && error.details.newspaper) setReload(n => n + 1);
    } finally { setBusy(false); }
  }

  function field(key: string, label: string, optional = false, type = 'text') {
    return <label key={key} className="block text-sm font-medium text-[#293B35]">{label}{optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
      <input name={key} value={values[key]} onChange={e => change(key, e.target.value)} type={type} required={!optional}
        maxLength={key.endsWith('title') ? 30 : type === 'email' ? 254 : type === 'tel' ? 30 : 100}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'} className={inputClass}/>
    </label>;
  }

  return <Dialog title={result ? 'Application received' : step === 0 ? 'Choose a service' : 'Change of Name'} onClose={onClose} busy={busy}>
    {result ? <div className="py-6 text-center space-y-5">
      <CheckCircle2 className="mx-auto text-[#006747]" size={52}/>
      <h3 className="text-2xl font-semibold">Your application has been saved</h3>
      <p className="text-sm text-[#53645D]">Your details and documents are saved. Complete payment below to begin review.</p>
      <p className="rounded-lg bg-[#EDF7F2] p-4 font-mono text-xs break-all">{result.reference_no}</p>
      <PaymentControls application={result} onUpdated={onSubmitted}/>
      <button onClick={onClose} className={primaryClass}>View my applications <ArrowRight size={16}/></button>
    </div> : <>
      {optionsError && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{optionsError} <button onClick={() => setReload(n => n + 1)} className="ml-2 underline">Retry</button></div>}
      {!options && !optionsError && <p role="status" className="py-6 text-sm text-gray-500">Loading available services…</p>}
      {step === 0 && options && <>
        <p className="mb-6 text-sm text-[#53645D]">Select the service you’d like to apply for.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map(service => {
            const enabled = service.id === 'change-of-name' && options.change_of_name_available;
            return <button key={service.id} disabled={!enabled} onClick={() => setStep(1)}
              className={`relative rounded-xl border p-5 text-left transition ${enabled ? 'border-[#A9D8C0] bg-[#F5FBF7] hover:border-[#006747] hover:shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
              <FileText size={23} className={enabled ? 'text-[#006747] mb-3' : 'mb-3'}/>
              <span className="block font-semibold text-sm">{service.title}</span>
              <span className="mt-2 block text-xs">{enabled ? preferredService === service.id ? 'Your selected service · Get started →' : 'Get started →' : service.id === 'change-of-name' ? 'Currently unavailable' : 'Coming soon'}</span>
            </button>;
          })}
        </div>
      </>}
      {step > 0 && <>
        <ol aria-label="Application steps" className="grid grid-cols-4 gap-2 mb-7">
          {steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`border-t-4 pt-2 text-xs ${step >= index + 1 ? 'border-[#006747] text-[#006747]' : 'border-gray-100 text-gray-400'}`}>{index + 1}. {label}</li>)}
        </ol>
        {Object.keys(errors).length > 0 && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {Object.entries(errors).map(([key, value]) => <p key={key}><strong className="capitalize">{key.replaceAll('_', ' ')}: </strong>{typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : String(value)}</p>)}
        </div>}
        <form onSubmit={advance}>
          {step === 1 && <div className="space-y-7">
            {['former', 'new'].map(prefix => <fieldset key={prefix}><legend className="font-semibold mb-4">{prefix === 'former' ? 'Former name' : 'New name'}</legend>
              <div className="grid sm:grid-cols-2 gap-4">{field(`${prefix}_title`, `${prefix === 'former' ? 'Former' : 'New'} title`)}{field(`${prefix}_first_name`, 'First name')}{field(`${prefix}_middle_name`, 'Middle name', true)}{field(`${prefix}_last_name`, 'Last name')}</div>
            </fieldset>)}
            <fieldset><legend className="font-semibold mb-4">Contact details</legend><div className="grid sm:grid-cols-2 gap-4">{field('email', 'Email address', false, 'email')}{field('phone', 'Phone number', false, 'tel')}</div></fieldset>
          </div>}
          {step === 2 && <div className="space-y-4">
            <p className="text-sm text-[#53645D]">Upload your sworn affidavit and any supporting documents. PDF, JPG or PNG, up to 10 MB each; 10 files total.</p>
            {Object.entries(options?.document_types || {}).map(([key, label]) => <div key={key} className="rounded-xl border border-[#E5ECE8] p-4">
              <label className="block text-sm font-medium"><span className="flex items-center gap-2"><Upload size={16} className="text-[#006747]"/>{label}</span><span className="block text-xs text-gray-500 mt-1">{key === 'affidavit' ? 'Required · one file' : 'Optional · multiple files allowed'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple={key !== 'affidavit'} onChange={e => { addFiles(key, e.target.files); e.target.value = ''; }} className="mt-3 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#EDF7F2] file:px-3 file:py-2 file:text-[#006747]"/>
              </label>
              {!!uploads[key]?.length && <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploads[key].map((file, index) => <DocumentPreviewCard key={`${file.name}-${index}`} source={file} name={file.name}
                  onRemove={() => setUploads(old => ({ ...old, [key]: old[key].filter((_, i) => i !== index) }))}/>)}
              </div>}
            </div>)}
          </div>}
          {step === 3 && <fieldset><legend className="font-semibold mb-2">Choose your newspaper</legend>
            <p className="text-sm text-[#53645D] mb-5">Select one of the newspapers currently available for your application.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{options?.newspapers.map(paper => <label key={paper.slug} className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-6 min-h-36 ${values.newspaper === paper.slug ? 'border-[#006747] bg-[#F5FBF7]' : 'border-[#E5ECE8] hover:border-[#A9D8C0]'}`}>
              <input type="radio" name="newspaper" value={paper.slug} checked={values.newspaper === paper.slug} onChange={() => change('newspaper', paper.slug)} required className="absolute top-3 right-3 accent-[#006747]"/>
              <img src={paper.logo_url} alt="" className={`h-12 w-full mb-3 ${paper.slug === 'guardian' ? 'object-cover' : 'object-contain'}`} onError={e => { e.currentTarget.style.display = 'none'; }}/>
              <span className="text-sm font-medium">{paper.name}</span>
            </label>)}</div>
            {options && !options.newspapers.length && <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm">No newspapers are available right now. Please try again later.</p>}
          </fieldset>}
          {step === 4 && <div className="space-y-5">
            <h3 className="font-semibold">Review your application</h3>
            <div className="rounded-xl border border-[#A9D8C0] bg-[#EDF7F2] p-4"><p className="text-sm">Application fee</p><p className="mt-1 text-2xl font-semibold">{options?.fee ? money(options.fee) : 'Fee unavailable'}</p><p className="mt-2 text-xs text-[#53645D]">The fee is the same for any available newspaper. Your saved application will show the final amount before payment.</p></div>
            <dl className="grid sm:grid-cols-2 gap-4 rounded-xl bg-[#F5F8F6] p-5 text-sm">
              {[['Former name', fullName('former')], ['New name', fullName('new')], ['Email', values.email], ['Phone', values.phone], ['Newspaper', newspaper?.name || 'Please select another newspaper']].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500 mb-1">{label}</dt><dd className="font-medium break-words">{value}</dd></div>)}
            </dl>
            <div><h4 className="text-sm font-semibold mb-3">Documents ({Object.values(uploads).flat().length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Object.entries(uploads).flatMap(([key, files]) => files.map((file, index) =>
                <DocumentPreviewCard key={`${key}-${index}`} source={file} name={file.name} description={options?.document_types[key]}/>))}</div>
            </div>
            <p className="text-xs text-gray-500">Save your application, then continue to secure payment with Paystack.</p>
          </div>}
          <div className="mt-7 border-t border-[#E5ECE8] pt-5 flex items-center justify-between gap-3">
            <button type="button" disabled={busy} onClick={() => { setErrors({}); setStep(step - 1); }} className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm disabled:opacity-50"><ArrowLeft size={16}/>Back</button>
            <button type="submit" disabled={busy || (step >= 3 && !options?.newspapers.length)} className={primaryClass}>{busy ? <><LoaderCircle size={16} className="animate-spin"/>Submitting…</> : <>{step === 4 ? 'Save and continue to payment' : 'Continue'}<ArrowRight size={16}/></>}</button>
          </div>
        </form>
      </>}
    </>}
  </Dialog>;
}
