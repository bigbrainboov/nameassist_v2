/* SIRI.DEV */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, FolderOpen, LockKeyhole, MoreHorizontal, Plus, RefreshCw, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { ApiError, type UploadProgress } from '../auth/api';
import { Dialog } from '../components/Dialog';
import { type Notice, Snackbar } from '../components/Snackbar';
import { DocumentPreviewCard } from './DocumentPreviewCard';
import { fileSizeLabel } from './documentPreview';
import { groupDocuments } from './documentGroups';
import { type ApplicationRecord, type DocumentRecord, deleteDocument, documentLabel, replaceDocument, uploadDocument } from './api';

const types = ['affidavit', 'nin', 'bvn_bank', 'passport', 'drivers_license', 'education', 'work'];
const secondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCEBE2] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#53645D] hover:bg-[#F4F7F5] disabled:opacity-50';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#006747] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00513B] disabled:opacity-50';
type Edit = { kind: 'upload' } | { kind: 'replace' | 'delete'; document: DocumentRecord };

function mutationError(error: unknown) {
  if (error instanceof ApiError) return Object.values(error.details).flat().join(' ') || error.message;
  return error instanceof Error ? error.message : 'Unable to save your change. Please try again.';
}

function Actions({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) ref.current?.removeAttribute('open'); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && ref.current?.open) { event.stopPropagation(); ref.current.removeAttribute('open'); ref.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', close);
    ref.current?.addEventListener('keydown', escape);
    const element = ref.current;
    return () => { document.removeEventListener('pointerdown', close); element?.removeEventListener('keydown', escape); };
  }, []);
  return <details ref={ref} className="relative">
    <summary aria-label={`Actions for ${name}`} className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-[#53645D] hover:bg-[#F4F7F5] [&::-webkit-details-marker]:hidden"><MoreHorizontal size={20}/></summary>
    <div onClick={event => { if ((event.target as HTMLElement).closest('button')) ref.current?.removeAttribute('open'); }}
      className="absolute bottom-full right-0 z-20 mb-2 min-w-48 rounded-xl border border-[#E0E8E3] bg-white p-1.5 text-xs shadow-lg [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-left [&_button:hover]:bg-[#F4F7F5]">
      {children}
    </div>
  </details>;
}

export function DocumentManager({ documents, applications, onUpdated, onRefresh, compact = false, snapshot = documents }: {
  documents: DocumentRecord[]; applications: ApplicationRecord[]; onUpdated: () => void; onRefresh?: () => void; compact?: boolean; snapshot?: DocumentRecord[];
}) {
  const [edit, setEdit] = useState<Edit | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [changes, setChanges] = useState<Record<string, DocumentRecord | null>>({});
  const dismiss = useCallback(() => setNotice(null), []);
  const notify = (kind: Notice['kind'], message: string) => setNotice({ id: Date.now(), kind, message });
  useEffect(() => {
    // onUpdated restarts the parent's loader and discards its older in-flight request.
    // A fresh complete snapshot supersedes optimistic records, including remote deletes.
    setChanges({});
  }, [snapshot]);
  const records = [...documents.filter(doc => !(doc.id in changes)), ...Object.values(changes).filter((doc): doc is DocumentRecord => doc !== null)]
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const groups = groupDocuments(records);
  const eligible = applications.filter(application => application.can_manage_documents);
  const counts = { all: groups.length, uploads: groups.filter(group => !group.document.is_deliverable).length, completed: groups.filter(group => group.document.is_deliverable).length };
  const filtered = groups.filter(group => (filter === 'all' || (filter === 'completed') === group.document.is_deliverable)
    && group.documents.some(doc => [doc.original_filename, documentLabel(doc.doc_type), doc.reference_no].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
  const selectedCopies = records.filter(doc => details?.includes(doc.id));
  const open = (next: Edit) => { setDetails(null); setNotice(null); setEdit(next); };

  return <section aria-label="Document library" className="space-y-5">
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E0E8E3] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-[#F1F5F2] p-1" aria-label="Document filters">
          {([['all', 'All files'], ['uploads', 'Uploads'], ['completed', 'Completed']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${filter === value ? 'bg-white text-[#006747] shadow-sm' : 'text-[#687A70] hover:text-[#12352C]'}`}>
            {label}<span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${filter === value ? 'bg-[#EDF7F2]' : 'bg-[#E5ECE7]'}`}>{counts[value]}</span>
          </button>)}
        </div>
        {eligible.length > 0 && <button type="button" className={primary} onClick={() => open({ kind: 'upload' })}><Plus size={17}/>Upload document</button>}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#E0E8E3] bg-[#FCFDFC] px-3.5 text-[#819087]">
          <Search size={16} className="shrink-0"/><input aria-label="Search documents" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by filename, type or application…" className="min-w-0 w-full bg-transparent py-2.5 text-sm text-[#293B35] outline-none"/>
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14}/></button>}
        </label>
        {onRefresh && <button type="button" onClick={onRefresh} className={secondary} aria-label="Refresh documents"><RefreshCw size={14}/><span className="hidden sm:inline">Refresh</span></button>}
      </div>
    </div>

    {filtered.length > 0 ? <>
      <p className="text-xs text-[#819087]">{filtered.length} {filtered.length === 1 ? 'file' : 'files'}{query ? ' matching your search' : ' in your library'}</p>
      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${compact ? '' : 'xl:grid-cols-3'}`}>
        {filtered.map(({ document, documents: copies, types: groupTypes }) => <DocumentPreviewCard
          key={`${document.id}-${document.updated_at}`} source={document.id} version={document.updated_at}
          name={document.original_filename || documentLabel(document.doc_type)} subtitle={groupTypes.map(documentLabel).join(' · ')}
          badge={document.is_deliverable ? 'Completed' : 'Uploaded'} onFeedback={message => notify('error', message)}
          description={<div className="flex items-center justify-between gap-2 text-[11px]">
            <span>{new Date(document.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <button type="button" onClick={() => setDetails(copies.map(copy => copy.id))} className="inline-flex items-center gap-1 font-medium text-[#006747]"><FolderOpen size={12}/>{copies.length > 1 ? `${copies.length} attachments` : 'Application details'}</button>
          </div>}
          actions={(download, downloading) => <Actions name={document.original_filename || documentLabel(document.doc_type)}>
            <button type="button" disabled={downloading} onClick={download}><Download size={14}/>{downloading ? 'Downloading…' : 'Download'}</button>
            <button type="button" onClick={() => setDetails(copies.map(copy => copy.id))}><FolderOpen size={14}/>{copies.length > 1 ? 'Manage attachments' : 'Application details'}</button>
            {copies.length === 1 && document.can_replace && <button type="button" onClick={() => open({ kind: 'replace', document })}><RefreshCw size={14}/>Replace file</button>}
            {copies.length === 1 && document.can_delete && <button type="button" onClick={() => open({ kind: 'delete', document })} className="text-red-700"><Trash2 size={14}/>Delete file</button>}
          </Actions>}/>)}
      </div>
    </> : <div className="rounded-2xl border border-dashed border-[#D6E2DA] bg-white/70 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF7F2] text-[#006747]"><FolderOpen size={27} strokeWidth={1.5}/></div>
      <h3 className="text-base font-semibold">{records.length ? 'No matching documents' : 'Your documents will live here'}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#687A70]">{records.length ? 'Try another search or switch to All files.' : 'Upload supporting files to an application, then preview and manage them here.'}</p>
      {records.length > 0 ? <button type="button" onClick={() => { setFilter('all'); setQuery(''); }} className="mt-5 text-sm font-semibold text-[#006747]">Clear filters</button>
        : eligible.length > 0 && <button type="button" className={`${primary} mt-5`} onClick={() => open({ kind: 'upload' })}><Plus size={16}/>Upload your first document</button>}
    </div>}
    <p className="flex items-start gap-2 text-xs leading-relaxed text-[#819087]"><LockKeyhole size={14} className="mt-0.5 shrink-0"/>Your documents are private. Uploads can be changed until document review begins. Required affidavits can only be replaced.</p>

    {details && <Dialog title="Document details" onClose={() => setDetails(null)}>
      {selectedCopies.length > 1 && <p className="mb-5 text-sm text-[#53645D]">This file is used more than once. Choose the attachment you want to change; the other copies will stay as they are.</p>}
      <div className="space-y-4">{selectedCopies.map(copy => <div key={copy.id} className="rounded-xl border border-[#E0E8E3] p-4">
        <h3 className="text-sm font-semibold">{documentLabel(copy.doc_type)}</h3>
        {copy.original_filename && <p className="mt-1 break-words text-sm text-[#53645D]">{copy.original_filename}</p>}
        <p className="mt-3 text-[11px] uppercase tracking-wide text-[#819087]">Application reference</p><p className="mt-1 break-all text-xs">{copy.reference_no}</p>
        {copy.can_replace ? <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => open({ kind: 'replace', document: copy })}><RefreshCw size={13}/>Replace file</button>
          {copy.can_delete && <button type="button" className={`${secondary} !text-red-700`} onClick={() => open({ kind: 'delete', document: copy })}><Trash2 size={13}/>Delete attachment</button>}
        </div> : <p className="mt-4 flex items-center gap-1.5 text-xs text-[#819087]"><LockKeyhole size={12}/>{copy.is_deliverable ? 'Completed documents are read-only.' : 'This attachment is locked for changes.'}</p>}
      </div>)}</div>
    </Dialog>}
    {edit && <DocumentEditDialog edit={edit} applications={eligible} documents={records} onClose={() => setEdit(null)} onUpdated={onUpdated}
      onFailure={message => notify('error', message)} onSaved={saved => {
        if (saved) setChanges(previous => ({ ...previous, [saved.id]: saved }));
        else if (edit.kind === 'delete') setChanges(previous => ({ ...previous, [edit.document.id]: null }));
        notify('success', edit.kind === 'delete' ? 'Document deleted from this application.' : edit.kind === 'replace' ? 'Document replaced successfully.' : 'Document uploaded successfully.');
        setEdit(null); onUpdated();
      }}/>} 
    <Snackbar notice={notice} onDismiss={dismiss}/>
  </section>;
}

function DocumentEditDialog({ edit, applications, documents, onClose, onSaved, onUpdated, onFailure }: {
  edit: Edit; applications: ApplicationRecord[]; documents: DocumentRecord[];
  onClose: () => void; onSaved: (saved?: DocumentRecord) => void; onUpdated: () => void; onFailure: (message: string) => void;
}) {
  const [application, setApplication] = useState(applications[0]?.id || '');
  const [docType, setDocType] = useState('nin');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<UploadProgress>({ phase: 'uploading', percent: 0 });
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const target = edit.kind === 'upload' ? null : edit.document;
  const title = edit.kind === 'delete' ? 'Delete document?' : edit.kind === 'replace' ? 'Replace document' : 'Upload document';
  const hasAffidavit = documents.some(doc => doc.application === application && doc.doc_type === 'affidavit' && !doc.is_deliverable);
  const stillAllowed = edit.kind === 'upload' ? applications.some(app => app.id === application)
    : documents.some(doc => doc.id === target?.id && doc.updated_at === target.updated_at && (edit.kind === 'delete' ? doc.can_delete : doc.can_replace));
  const fail = (message: string) => { setError(message); onFailure(message); };
  function selectFile(next: File | undefined) {
    if (!next || busy) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(next.name) || next.size > 10 * 1024 * 1024 || !next.size) {
      fail('Choose a non-empty PDF, JPG or PNG file no larger than 10 MB.'); return;
    }
    setFile(next); setError('');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !stillAllowed) return;
    setError('');
    if (edit.kind !== 'delete' && !file) { fail('Choose a PDF, JPG or PNG file first.'); return; }
    setBusy(true); setProgress({ phase: 'uploading', percent: 0 });
    try {
      if (edit.kind === 'delete') { await deleteDocument(edit.document); onSaved(); }
      else if (edit.kind === 'replace') onSaved(await replaceDocument(edit.document, file!, setProgress));
      else onSaved(await uploadDocument(application, docType, file!, setProgress));
    } catch (failure) {
      fail(mutationError(failure));
      onUpdated();
    } finally { setBusy(false); }
  }
  return <Dialog title={title} onClose={onClose} busy={busy}>
    <form onSubmit={save} className="space-y-5">
      {target && <div className="flex gap-3 rounded-xl bg-[#F4F7F5] p-4"><FileText size={22} className="shrink-0 text-[#006747]"/><div className="min-w-0"><p className="break-words text-sm font-semibold">{target.original_filename || documentLabel(target.doc_type)}</p><p className="mt-1 break-all text-xs text-[#687A70]">{target.reference_no}</p></div></div>}
      {edit.kind === 'upload' && <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#53645D]">Application<select required value={application} onChange={event => { setApplication(event.target.value); setDocType('nin'); }} disabled={busy} className="mt-2 w-full rounded-xl border border-[#DCEBE2] bg-white p-3 text-sm font-normal">
          {applications.map(app => <option key={app.id} value={app.id}>{app.reference_no} · {app.service_name}</option>)}
        </select></label>
        <label className="block text-xs font-semibold text-[#53645D]">Document type<select value={docType} onChange={event => setDocType(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-[#DCEBE2] bg-white p-3 text-sm font-normal">
          {types.filter(type => type !== 'affidavit' || !hasAffidavit).map(type => <option key={type} value={type}>{documentLabel(type)}</option>)}
        </select></label>
      </div>}
      {edit.kind === 'delete' ? <p className="text-sm leading-relaxed text-[#53645D]">This will remove the attachment from this application. This action cannot be undone. Copies used in other applications will remain.</p> : <>
        <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" aria-label="Choose document file" disabled={busy} onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ''; }} className="sr-only" tabIndex={-1}/>
        <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length > 1) fail('Choose one file at a time.'); else selectFile(event.dataTransfer.files[0]); }}
          className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors disabled:opacity-60 ${dragging ? 'border-[#006747] bg-[#EDF7F2]' : 'border-[#D6E2DA] bg-[#FAFCFA] hover:border-[#006747]/60'}`}>
          <span className="mb-3 rounded-xl bg-[#EDF7F2] p-3 text-[#006747]"><UploadCloud size={25} strokeWidth={1.5}/></span>
          <span className="text-sm font-semibold text-[#12352C]">{file ? 'Choose a different file' : 'Click to upload or drop your file here'}</span>
          <span className="mt-1.5 text-xs text-[#819087]">PDF, JPG or PNG · Up to 10 MB</span>
        </button>
        {file && <div className="flex items-center gap-3 rounded-xl border border-[#E0E8E3] p-3"><FileText size={22} className="shrink-0 text-[#006747]"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="mt-0.5 text-xs text-[#819087]">{fileSizeLabel(file.size)}</p></div><button type="button" disabled={busy} onClick={() => setFile(null)} aria-label="Remove selected file" className="rounded-lg p-2 text-[#819087]"><X size={16}/></button></div>}
        {busy && <div aria-live="polite" className="rounded-xl bg-[#EDF7F2] p-4">
          <div className="mb-2 flex justify-between gap-3 text-xs font-semibold text-[#006747]"><span>{progress.phase === 'saving' ? 'Saving document…' : 'Uploading document…'}</span><span>{progress.phase === 'saving' ? 'Almost there' : progress.percent === null ? '' : `${progress.percent}%`}</span></div>
          <progress aria-label={progress.phase === 'saving' ? 'Saving document' : 'Upload progress'} max={100} value={progress.phase === 'saving' ? undefined : progress.percent ?? undefined} className="h-2 w-full overflow-hidden rounded-full accent-[#006747]"/>
          <p className="mt-2 text-[11px] text-[#53645D]">{progress.phase === 'saving' ? 'Your file has been sent. Waiting for confirmation.' : 'Keep this window open until your upload is confirmed.'}</p>
        </div>}
        {file && !busy && <div className="mx-auto max-w-xs"><DocumentPreviewCard source={file} name={file.name}/></div>}
        <p className="text-xs leading-relaxed text-[#819087]">Up to 10 uploaded files per application.{edit.kind === 'replace' && ' Your existing file remains until the replacement is saved.'}</p>
      </>}
      {!stillAllowed && <p role="alert" className="text-sm text-amber-800">This document or application has changed. Close this dialog and check the latest documents.</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-[#EDF1EE] pt-4"><button type="button" disabled={busy} onClick={onClose} className={secondary}>Cancel</button>
        <button type="submit" disabled={busy || !stillAllowed} className={`${primary} ${edit.kind === 'delete' ? '!bg-red-700 hover:!bg-red-800' : ''}`}>
          {busy ? edit.kind === 'delete' ? 'Deleting…' : progress.phase === 'saving' ? 'Saving…' : 'Uploading…' : edit.kind === 'delete' ? 'Delete document' : edit.kind === 'replace' ? 'Save replacement' : 'Upload document'}
        </button>
      </div>
    </form>
  </Dialog>;
}
