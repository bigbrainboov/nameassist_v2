/* SIRI.DEV */
import React, { useRef, useState } from 'react';
import { CheckCircle2, FileUp, LoaderCircle, UploadCloud, X } from 'lucide-react';
import type { DocumentRecord } from '../applications/api';
import { adminErrorMessage, uploadAdminDocument } from './api';

export function AdminDocumentUpload({ applicationId, onUploaded }: {
  applicationId: string; onUploaded: (document: DocumentRecord) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState('final_document');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  function choose(value: File | null) {
    setError(''); setSuccess('');
    if (value && (!/\.(pdf|png|jpe?g)$/i.test(value.name) || value.size > 10 * 1024 * 1024 || value.size === 0)) {
      setFile(null); setError('Choose a non-empty PDF, JPG or PNG file, up to 10 MB.');
      if (input.current) input.current.value = '';
      return;
    }
    setFile(value);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || submitting.current) return;
    submitting.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      const document = await uploadAdminDocument(applicationId, file, kind);
      setFile(null);
      if (input.current) input.current.value = '';
      setSuccess(`${document.original_filename || file.name} is now available for the customer to download.`);
      onUploaded(document);
    } catch (err) { setError(adminErrorMessage(err)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="mb-6 rounded-2xl border border-[#CFE2D5] bg-[#F6FAF7] p-5">
    <div className="flex items-start gap-3"><span className="rounded-xl bg-[#E3F0E7] p-2.5 text-[#006747]"><FileUp size={20} /></span><div><h3 className="text-sm font-semibold">Send a document to the customer</h3><p className="mt-1 text-xs leading-relaxed text-[#63786A]">Uploaded files appear in the customer’s documents immediately. Upload one file at a time.</p></div></div>
    <fieldset disabled={busy} className="mt-5 space-y-4">
      <label className="block text-xs font-medium text-[#435C4C]">Document type<select value={kind} onChange={e => setKind(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D2E0D7] bg-white px-3 py-2.5 text-sm"><option value="final_document">Final document</option><option value="newspaper_publication">Newspaper publication</option><option value="affidavit">Affidavit</option><option value="supporting_document">Supporting document</option></select></label>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#ADCDB8] bg-white px-4 py-6 text-center transition hover:border-[#006747] focus-within:ring-2 focus-within:ring-[#006747]">
        <UploadCloud size={25} className="text-[#006747]" /><span className="text-sm font-medium text-[#294F39]">{file ? file.name : 'Choose a document to upload'}</span><span className="text-[11px] text-[#7B8D80]">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · click to change` : 'PDF, JPG or PNG · maximum 10 MB'}</span>
        <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => choose(e.target.files?.[0] || null)} className="sr-only" aria-label="Document to send to customer" />
      </label>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error} If your connection was interrupted, check the document list before retrying.</p>}
    {success && <p role="status" className="mt-3 flex items-start gap-1.5 text-xs text-[#006747]"><CheckCircle2 size={14} className="shrink-0" />{success}</p>}
    <div className="mt-4 flex justify-end gap-2">{file && <button type="button" disabled={busy} onClick={() => { choose(null); if (input.current) input.current.value = ''; }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-[#63786A]"><X size={13} />Clear</button>}<button type="submit" disabled={!file || busy} className="inline-flex items-center gap-2 rounded-xl bg-[#006747] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004D38] disabled:opacity-40">{busy && <LoaderCircle size={14} className="animate-spin" />}{busy ? 'Uploading…' : 'Upload for customer'}</button></div>
  </form>;
}
