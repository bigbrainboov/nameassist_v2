/* SIRI.DEV */
import React from 'react';
import { Check, Clock, Minus } from 'lucide-react';
import { type ApplicationRecord, statusLabel } from './api';
import { applicationProgress } from './progress';
export function ApplicationProgress({ application, compact = false }: { application: ApplicationRecord; compact?: boolean }) {
  const progress = applicationProgress(application);
  return <section className={compact ? 'mt-4 w-full' : 'my-5 rounded-xl border border-[#DCEBE2] bg-[#F7FAF8] p-5'} aria-label={`Progress for ${application.reference_no}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[#12352C]">{progress.waitingForPayment ? 'Awaiting payment' : statusLabel(application.status)}</h3>
      <span className="text-[11px] text-[#53645D]">Updated {new Date(application.updated_at).toLocaleString()}</span></div>
    <p className="mt-2 text-xs text-[#53645D]">{progress.description}</p>
    <ol className={`mt-4 grid gap-2 ${compact ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {progress.steps.map((step, index) => <li key={step.status} aria-current={step.state === 'current' ? 'step' : undefined}
        className={`rounded-lg border p-2.5 ${step.state === 'current' ? 'border-[#006747] bg-[#EDF7F2]' : step.state === 'done' ? 'border-[#A9D8C0] bg-white' : 'border-[#E5ECE8] bg-white text-gray-400'}`}>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold">{step.state === 'done' ? <Check size={13}/> : step.state === 'skipped' ? <Minus size={13}/> : step.state === 'current' ? <Clock size={13}/> : <span>{index + 1}.</span>}{statusLabel(step.status)}</span>
        {!compact && <span className="mt-1 block text-[10px]">{step.state === 'done' ? 'Completed' : step.state === 'current' ? 'Current stage' : step.state === 'skipped' ? 'Not recorded on this application' : 'Upcoming'}</span>}
      </li>)}
    </ol>
    {progress.latest?.note && <p className="mt-3 text-xs text-[#53645D]"><span className="font-semibold">Latest update: </span>{progress.latest.note}</p>}
  </section>;
}
