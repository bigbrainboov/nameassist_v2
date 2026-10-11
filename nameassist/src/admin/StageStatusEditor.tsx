/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import { type AdminApplicationRecord, AdminApiError, adminRequest } from './api';
import { statusLabel } from '../applications/api';
export function StageStatusEditor({ application, onUpdated, compact = false }: {
  application: AdminApplicationRecord; onUpdated: (application: AdminApplicationRecord) => void; compact?: boolean;
}) {
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setNext(current => application.allowed_transitions.includes(current) ? current : ''); }, [application.allowed_transitions]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); event.stopPropagation(); if (busy || !next) return;
    setBusy(true); setMessage('');
    try {
      const updated = await adminRequest<AdminApplicationRecord>(`/admin/applications/${application.id}/status/`, { status: next, note });
      onUpdated(updated); setNext(''); setNote(''); setMessage('Stage updated. Visible on the customer dashboard.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) window.location.hash = '#/admin/login';
      setMessage(error instanceof Error ? error.message : 'Unable to update the stage.');
    } finally { setBusy(false); }
  }
  if (!application.allowed_transitions.length) return <p className="mt-2 text-xs text-[#006747]">Application completed</p>;
  return <form onSubmit={save} onClick={event => event.stopPropagation()} className="mt-3 space-y-2">
    <label className="block text-[11px] font-semibold text-[#53645D]">Update stage
      <select aria-label={`Update stage for ${application.reference_no}`} value={next} disabled={busy} onChange={event => { setNext(event.target.value); setMessage(''); }} className="mt-1 w-full rounded-lg border border-[#CCDAD2] bg-white px-2 py-2 text-xs">
        <option value="">Select next stage</option>{application.allowed_transitions.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
      </select>
    </label>
    {!compact && <label className="block text-xs">Update for the customer (optional)<textarea disabled={busy} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/></label>}
    {next === 'completed' && <p className="text-[11px] text-[#53645D]">A final deliverable document must be attached before completion.</p>}
    <button disabled={busy || !next} className="rounded-lg bg-[#006747] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save stage'}</button>
    {message && <p role="status" className="text-[11px] text-[#53645D]">{message}</p>}
  </form>;
}
