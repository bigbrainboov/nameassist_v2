/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { adminErrorMessage, adminList, loadAdminDocument, type AdminApplicationRecord } from './api';
import { DocumentPreviewCard } from '../applications/DocumentPreviewCard';
import { documentLabel, type DocumentRecord } from '../applications/api';

export function DocumentDeliveryView({ applications, onUpdated }: { applications: AdminApplicationRecord[]; onUpdated: () => void }) {
  const [selected, setSelected] = useState('');
  const application = applications.find(item => item.id === selected);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setDocuments([]); setError('');
    if (!selected) { setLoading(false); return; }
    setLoading(true);
    adminList<DocumentRecord>(`documents/?application=${encodeURIComponent(selected)}`)
      .then(data => { if (active) setDocuments(data); })
      .catch(err => { if (active) setError(adminErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected, retry]);
  return <div className="space-y-6"><header><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6A8072]">Customer delivery</p><h1 className="mt-1 text-2xl font-semibold">Documents</h1><p className="mt-2 text-sm text-[#63786A]">Upload completed files and supporting documents to a customer’s application.</p></header>
    <section className="rounded-2xl border border-[#DCE7DF] bg-white p-5 sm:p-6"><label className="block text-xs font-semibold text-[#435C4C]">Select a paid application<select value={selected} onChange={e => setSelected(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D2E0D7] bg-white px-4 py-3 text-sm"><option value="">Choose a customer and application</option>{applications.map(app => <option key={app.id} value={app.id}>{app.customer_name || app.customer_email} · {app.reference_no}</option>)}</select></label>
      {!applications.length && <p className="mt-3 text-sm text-[#63786A]">There are no paid applications available yet.</p>}
    </section>
    {application ? <section key={application.id} className="rounded-2xl border border-[#DCE7DF] bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="font-semibold">{application.customer_name || application.customer_email}</h2><p className="mt-1 break-all text-xs text-[#63786A]">{application.service_name} · {application.reference_no}</p></div>
      <AdminDocumentUpload applicationId={application.id} onUploaded={document => { setDocuments(old => [document, ...old]); onUpdated(); }} />
      <h3 className="mb-4 text-sm font-semibold">Application documents</h3>
      {loading ? <p role="status" className="text-sm text-[#63786A]">Loading documents…</p> : error ? <p role="alert" className="text-sm text-red-700">{error} <button onClick={() => setRetry(n => n + 1)} className="underline">Retry</button></p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{documents.map(doc => <DocumentPreviewCard key={doc.id} source={doc.id} loadDocument={loadAdminDocument} name={doc.original_filename || documentLabel(doc.doc_type)} description={doc.is_deliverable ? 'Delivered to customer' : 'Uploaded by applicant'} badge={doc.is_deliverable ? 'Customer download' : undefined} />)}{!documents.length && <p className="text-sm text-[#63786A]">No documents uploaded yet.</p>}</div>}
    </section> : <div className="rounded-2xl border border-dashed border-[#CDDED2] p-12 text-center text-[#6A8072]"><FolderOpen size={32} className="mx-auto mb-3 text-[#8BAC96]" /><p className="text-sm">Choose an application to view and deliver its documents.</p></div>}
  </div>;
}
