/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import type { User } from '../auth/api';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { DocumentDeliveryView } from './DocumentDeliveryView';
import { ReferralsView } from './ReferralsView';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { ApplicationsView } from './ApplicationsView';
import { presentApplication, ADMIN_STAGES, STAGE_NAMES } from './presentation';
import { StageStatusEditor } from './StageStatusEditor';
import { ApplicationProgress } from '../applications/ApplicationProgress';
import { Dialog } from '../components/Dialog';
import { DocumentPreviewCard } from '../applications/DocumentPreviewCard';
import { type DocumentRecord, documentLabel, statusLabel } from '../applications/api';
import { money } from '../applications/payment';
import { AdminApiError, type AdminApplicationRecord, adminList, adminLogout, adminRequest, loadAdminDocument } from './api';

const primary = 'rounded-lg bg-[#006747] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const date = (value: string) => new Date(value).toLocaleString();
function authError(error: unknown) {
  if (error instanceof AdminApiError && error.status === 401) window.location.hash = '#/admin/login';
  return error instanceof Error ? error.message : 'Unable to load records. Please retry.';
}

function ApplicationDetails({ application, onClose, onUpdated }: {
  application: AdminApplicationRecord; onClose: () => void; onUpdated: (application: AdminApplicationRecord) => void;
}) {
  const [tab, setTab] = useState('stages');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentError, setDocumentError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setDocumentError('');
    adminList<DocumentRecord>(`documents/?application=${application.id}`).then(data => { if (active) setDocuments(data); })
      .catch(error => { if (active) setDocumentError(authError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [application.id, retry]);
  const details = application.change_of_name;
  return <Dialog variant="admin" title={presentApplication(application).applicantName} subtitle={<><span className="font-mono break-all">{application.reference_no}</span><p className="mt-1">{application.service_name}</p></>} onClose={onClose}>
    <div className="border-b border-[#DCEBE2] bg-[#F7FAF8] px-5 flex items-center gap-2 overflow-x-auto" aria-label="Application details">
      {[['stages', 'Stage Tracker'], ['details', 'Applicant Details'], ['history', 'Status History'], ['documents', 'Documents']].map(([key, label]) =>
        <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)} className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${tab === key ? 'border-[#006747] text-[#006747]' : 'border-transparent text-[#53645D] hover:text-[#12352C]'}`}>{label}</button>)}
    </div><div className="p-5 sm:p-6">
    <div className="my-5 flex flex-wrap justify-between gap-3 rounded-xl bg-[#EDF7F2] p-4">
      <div><p className="font-semibold text-[#006747]">Payment confirmed · {money(application.payment.amount)}</p><p className="mt-1 break-all font-mono text-xs">{application.payment.reference}</p></div>
      <p className="text-sm">{statusLabel(application.status)}</p>
    </div>
    {tab === 'details' && <><h3 className="mb-3 font-semibold">Applicant details</h3>
    <dl className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-gray-500">Account holder</dt><dd>{application.customer_name}</dd></div>
      <div><dt className="text-xs text-gray-500">Account email</dt><dd className="break-all">{application.customer_email}</dd></div>
      {details && Object.entries(details).filter(([key]) => key !== 'newspaper').map(([key, value]) => <div key={key}><dt className="text-xs capitalize text-gray-500">{key.replaceAll('_', ' ')}</dt><dd className="break-words">{value || '—'}</dd></div>)}
    </dl></>}
    {tab === 'documents' && <><AdminDocumentUpload applicationId={application.id} onUploaded={document => {
      setDocuments(old => [document, ...old]);
      adminRequest<AdminApplicationRecord>(`/admin/applications/${application.id}/`).then(onUpdated).catch(error => setDocumentError(authError(error)));
    }} /><h3 className="mb-3 font-semibold">Documents</h3>
    {loading ? <p role="status" className="mb-5 text-sm">Loading documents…</p> : documentError ? <p role="alert" className="mb-5 text-sm text-red-700">{documentError} <button onClick={() => setRetry(n => n + 1)} className="underline">Retry</button></p> :
      <div className="mb-6 grid gap-3 sm:grid-cols-2">{documents.map(document => <DocumentPreviewCard key={document.id} source={document.id}
        loadDocument={loadAdminDocument} name={document.original_filename || documentLabel(document.doc_type)} description={document.is_deliverable ? 'Completed document' : 'Applicant upload'}/>)}
        {!documents.length && <p className="text-sm text-gray-500">No documents attached.</p>}</div>}</>}
    {tab === 'history' && <><h3 className="mb-3 font-semibold">Status history</h3>
    <ol className="mb-6 space-y-3">{[...application.status_history].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((event, index) =>
      <li key={index} className="border-l-2 border-[#006747] pl-3 text-sm"><p className="font-medium">{statusLabel(event.status)}</p><p className="text-xs text-gray-500">{date(event.timestamp)}</p><p>{event.note}</p></li>)}</ol></>}
    {tab === 'stages' && <><ApplicationProgress application={application}/><StageStatusEditor application={application} onUpdated={onUpdated}/></>}

    </div>
  </Dialog>;
}

export function AdminPortal({ currentPath }: { currentPath: string }) {
  const [applications, setApplications] = useState<AdminApplicationRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = applications.find(application => application.id === selectedId) || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const path = currentPath.split('?')[0];
  const overview = path === '#/admin';
  const supported = overview || ['#/admin/applications', '#/admin/documents', '#/admin/referrals'].includes(path);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const [data, profile] = await Promise.all([adminList<AdminApplicationRecord>('applications/?payment_status=paid'), adminRequest<User>('/auth/me/')]);
        if (active) { setApplications(data); setUser(profile); setError(''); }
      } catch (error) { if (active) setError(authError(error)); }
      finally { if (active) setLoading(false); }
    }
    void refresh();
    return () => { active = false; };
  }, [revision]);
  async function logout() {
    setSigningOut(true);
    try { await adminLogout(); window.location.hash = '#/admin/login'; }
    catch (error) { setError(authError(error)); }
    finally { setSigningOut(false); }
  }
  const rows = applications.map(presentApplication);
  return <AdminLayout currentPath={currentPath} user={user} applications={applications} onSignOut={logout} signingOut={signingOut}>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error} <button onClick={() => setRevision(n => n + 1)} className="ml-2 underline">Retry</button></p>}
    {loading ? <section className="rounded-2xl border border-[#DCEBE2] bg-white p-8 text-center text-sm text-[#53645D]" role="status">Loading your registry workspace…</section> : !supported ?
      <section className="rounded-2xl border border-[#DCEBE2] bg-white p-8 shadow-sm"><h1 className="font-serif text-xl font-bold text-[#12352C]">Workspace section</h1><p className="mt-3 text-sm text-[#53645D]">This section is not connected yet. Application details include document previews and payment confirmation.</p><a href="#/admin/applications" className="mt-5 inline-block text-xs font-semibold text-[#006747]">Open Applications Docket →</a></section> :
      path === '#/admin/referrals' ? <ReferralsView /> : path === '#/admin/documents' ? <DocumentDeliveryView applications={applications} onUpdated={() => setRevision(n => n + 1)} /> :
      overview ? <AdminDashboard applications={rows} onSelect={setSelectedId} onRefresh={() => setRevision(n => n + 1)}/> :
        <ApplicationsView onUpdated={updated => { setApplications(old => old.map(app => app.id === updated.id ? updated : app)); setRevision(n => n + 1); }} applications={rows} currentPath={currentPath} onSelect={setSelectedId} onRefresh={() => setRevision(n => n + 1)}/>}
    {selected && <ApplicationDetails key={selected.id} application={selected} onClose={() => setSelectedId(null)} onUpdated={updated => {
      setApplications(old => old.map(app => app.id === updated.id ? updated : app)); setRevision(n => n + 1);
    }}/>}
  </AdminLayout>;
}
