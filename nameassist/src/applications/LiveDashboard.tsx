/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import { ArrowRight, FileText, Plus, Search } from 'lucide-react';
import { type DashboardTab } from '../types';
import { ApplicationProgress } from './ApplicationProgress';
import { APPLICATION_STAGES } from './progress';
import { PaymentControls } from './PaymentControls';
import { money } from './payment';
import { Dialog } from '../components/Dialog';
import { DocumentManager } from './DocumentManager';
import { reconcilePreviews } from './previewCache';
import { type ApplicationRecord, type DocumentRecord, type PaymentRecord, loadAll, statusLabel } from './api';

function useRecords<T>(resource: string, revision: number) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const records = await loadAll<T>(resource);
        if (active) { setData(records); setError(''); }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to refresh your records.'); }
      finally { if (active) setLoading(false); }
    }
    void refresh();
    return () => { active = false; };
  }, [resource, revision, retry]);
  return { data, loading, error, retry: () => setRetry(value => value + 1) };
}
const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const panel = 'rounded-2xl border border-[#E5ECE8] bg-white p-5 sm:p-6';

function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="py-10 text-center text-sm text-[#53645D]">Loading your records…</p>;
  if (error) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{error}<button onClick={retry} className="ml-3 font-semibold underline">Retry</button></div>;
  return null;
}

export function LiveDashboard({ activeTab, revision, userName, onStart, onNavigate, onUpdated }: {
  onUpdated: () => void;
  activeTab: DashboardTab; revision: number; userName: string; onStart: () => void; onNavigate: (tab: DashboardTab) => void;
}) {
  const applications = useRecords<ApplicationRecord>('applications', revision);
  const documents = useRecords<DocumentRecord>('documents', revision);
  useEffect(() => {
    if (!documents.loading && !documents.error) void reconcilePreviews(documents.data);
  }, [documents.data, documents.loading, documents.error]);
  const payments = useRecords<PaymentRecord>('payments', revision);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRecord = applications.data.find(app => app.id === selectedId) || null;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const completed = applications.data.filter(application => application.status === 'completed').length;
  const awaitingPayment = applications.data.filter(app => app.payment.status !== 'paid' && app.status === 'received').length;
  const inProgress = applications.data.filter(app => app.payment.status === 'paid' && app.status !== 'completed').length;
  const filtered = applications.data.filter(application => {
    const name = application.change_of_name;
    const text = [application.reference_no, application.service_name, name?.former_first_name, name?.former_last_name, name?.new_first_name, name?.new_last_name].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (filter === 'all' || (filter === 'progress' ? application.payment.status === 'paid' && application.status !== 'completed' : filter === 'payment' ? application.payment.status !== 'paid' && application.status === 'received' : application.status === filter));
  });
  const visible = activeTab === 'dashboard' ? applications.data.slice(0, 5) : filtered;
  const title = activeTab === 'dashboard' ? `Welcome back, ${userName.split(' ')[0] || 'there'}` : ({ applications: 'My Applications', documents: 'My Documents', payments: 'Payments', support: 'Support', profile: 'My Profile' })[activeTab];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#102B23]">{title}</h1><p className="mt-2 text-sm text-[#53645D]">{activeTab === 'dashboard' ? 'Your applications and documents, all in one place.' : activeTab === 'applications' ? 'Track the progress of your submitted applications.' : activeTab === 'documents' ? 'Your uploaded documents and completed files.' : activeTab === 'payments' ? 'Payment records associated with your applications.' : 'Get help with your application.'}</p></div>
      {(activeTab === 'dashboard' || activeTab === 'applications') && <button onClick={onStart} className="inline-flex items-center gap-2 rounded-xl bg-[#006747] px-4 py-3 text-sm font-semibold text-white hover:bg-[#00513B]"><Plus size={17}/>{activeTab === 'dashboard' ? 'New Application' : 'Start New Application'}</button>}
    </header>
    {activeTab !== 'documents' && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#53645D]"><p>Use Refresh now to load the latest records.</p><button onClick={() => { applications.retry(); documents.retry(); payments.retry(); }} className="font-semibold text-[#006747]">Refresh now</button></div>}
    {(activeTab === 'dashboard' || activeTab === 'applications') && <>
      <LoadState {...applications}/>
      {!applications.loading && !applications.error && <>
        {activeTab === 'dashboard' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[['Total applications', applications.data.length], ['Awaiting payment', awaitingPayment], ['In progress', inProgress], ['Completed', completed]].map(([label, count]) => <div key={label} className={panel}><p className="text-3xl font-semibold text-[#006747]">{count}</p><p className="mt-2 text-sm text-[#53645D]">{label}</p></div>)}</div>}
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><h2 className="font-semibold">{activeTab === 'dashboard' ? 'Recent applications' : 'Your applications'}</h2>
            {activeTab === 'dashboard' && <button onClick={() => onNavigate('applications')} className="text-sm text-[#006747] flex items-center gap-1">View all <ArrowRight size={15}/></button>}</div>
          {activeTab === 'applications' && <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <label className="flex flex-1 items-center gap-2 border rounded-lg px-3"><Search size={16} className="text-gray-400"/><input aria-label="Search applications" placeholder="Search name, reference or service" value={query} onChange={e => setQuery(e.target.value)} className="py-2.5 w-full text-sm outline-none"/></label>
            <select aria-label="Filter applications" value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">All statuses</option><option value="progress">In progress</option><option value="payment">Awaiting payment</option>{APPLICATION_STAGES.map(stage => <option key={stage} value={stage}>{statusLabel(stage)}</option>)}</select>
          </div>}
          {!visible.length ? <div className="py-10 text-center"><FileText size={34} className="mx-auto mb-3 text-[#006747]"/><h3 className="font-medium">{applications.data.length ? 'No matching applications' : 'Your first application starts here'}</h3><p className="mt-2 text-sm text-[#53645D]">{applications.data.length ? 'Try a different search or status.' : 'Choose New Application to get started with Change of Name.'}</p></div> : <div className="divide-y divide-[#E5ECE8]">{visible.map(application => <article key={application.id} className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><h3 className="font-medium text-sm">{application.service_name}</h3><p className="mt-1 font-mono text-[11px] text-gray-500 break-all">{application.reference_no}</p><p className="mt-1 text-xs text-[#006747]">{application.payment.status === 'paid' ? 'Paid' : `Payment due · ${money(application.payment.amount)}`}</p><p className="mt-1 text-xs text-gray-500">Submitted {formatDate(application.created_at)}</p></div>
            <div className="flex items-center gap-4 shrink-0"><span className={`rounded-full px-3 py-1 text-xs ${application.status === 'completed' ? 'bg-[#EDF7F2] text-[#006747]' : 'bg-amber-50 text-amber-800'}`}>{statusLabel(application.status)}</span><button onClick={() => setSelectedId(application.id)} className="text-sm font-semibold text-[#006747]">View details</button></div></div>
            <ApplicationProgress application={application} compact/>
          </article>)}</div>}
        </section>
      </>}
    </>}
    {activeTab === 'documents' && <><LoadState {...documents}/>{!documents.loading && !documents.error && <DocumentManager documents={documents.data} applications={applications.data} onUpdated={onUpdated} onRefresh={() => { documents.retry(); applications.retry(); }}/>}</>}
    {activeTab === 'payments' && <><LoadState {...applications}/>{!applications.loading && !applications.error && applications.data.filter(app => app.payment.status !== 'paid').map(app => <section key={app.id} className={panel}><h2 className="font-semibold">{app.service_name}</h2><p className="mt-1 break-all font-mono text-xs">{app.reference_no}</p><PaymentControls application={app} onUpdated={onUpdated}/></section>)}<LoadState {...payments}/>{!payments.loading && !payments.error && <section className={panel}>{!payments.data.length ? <p className="text-sm text-[#53645D]">No payments recorded yet.</p> : <div className="space-y-4">{payments.data.map(payment => <article key={payment.id} className="flex justify-between gap-3 border-b pb-3 text-sm"><div><p className="font-semibold">{money(payment.amount)}</p><p className="text-xs text-gray-500 mt-1">{formatDate(payment.created_at)} · {payment.provider}</p></div><div className="text-right"><span className="capitalize">{payment.status === 'success' && !payment.verified_at ? 'Awaiting verification' : payment.status.replaceAll('_', ' ')}</span><p className="mt-1 break-all font-mono text-xs text-gray-500">{payment.gateway_reference}</p></div></article>)}</div>}</section>}</>}
    {activeTab === 'support' && <section className={panel}><h2 className="font-semibold">Talk to NameAssist</h2><p className="mt-2 mb-5 text-sm text-[#53645D]">Include your application reference when contacting us so we can help you faster.</p><a href="https://wa.me/2348142009941" target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-[#006747] px-5 py-3 text-sm text-white">Chat on WhatsApp ↗</a></section>}
    {selectedRecord && <Dialog title={selectedRecord.service_name} onClose={() => setSelectedId(null)}>
      <p className="font-mono text-xs break-all text-gray-500 mb-2">{selectedRecord.reference_no}</p><p className="mb-6 text-sm font-semibold text-[#006747]">{statusLabel(selectedRecord.status)}</p>
      <ApplicationProgress application={selectedRecord}/>
      {selectedRecord && <PaymentControls application={selectedRecord} onUpdated={onUpdated}/>}
      {selectedRecord.change_of_name && <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-7">{Object.entries(selectedRecord.change_of_name).filter(([key]) => key !== 'newspaper').map(([key, value]) => <div key={key}><dt className="text-xs capitalize text-gray-500 mb-1">{key.replaceAll('_', ' ')}</dt><dd className="break-words">{value || '—'}</dd></div>)}</dl>}
      <h3 className="font-semibold mb-3">Application history</h3><ol className="space-y-3 mb-7">{[...selectedRecord.status_history].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((history, index) => <li key={index} className="border-l-2 border-[#006747] pl-3 text-sm"><p className="font-medium">{statusLabel(history.status)}</p><p className="text-xs text-gray-500 mt-1">{formatDate(history.timestamp)}</p>{history.note && <p className="text-sm mt-1">{history.note}</p>}</li>)}</ol>
      <h3 className="font-semibold mb-3">Documents</h3><LoadState {...documents}/>{!documents.loading && !documents.error && <DocumentManager compact snapshot={documents.data} documents={documents.data.filter(document => document.application === selectedRecord.id)} applications={[selectedRecord]} onUpdated={onUpdated}/>}
    </Dialog>}
  </div>;
}
