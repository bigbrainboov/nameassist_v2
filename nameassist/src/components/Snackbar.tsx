/* SIRI.DEV */
import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type Notice = { id: number; kind: 'success' | 'error'; message: string };

export function Snackbar({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notice) return;
    // A manual popover lives above modal dialogs without stealing focus.
    ref.current?.showPopover?.();
    if (notice.kind === 'error') return;
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [notice?.id, onDismiss]);
  if (!notice) return null;
  const Icon = notice.kind === 'success' ? CheckCircle2 : AlertCircle;
  return <div ref={ref} popover="manual" role={notice.kind === 'error' ? 'alert' : 'status'}
    className={`fixed inset-auto bottom-5 left-1/2 z-[100] m-0 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border p-4 shadow-xl ${notice.kind === 'success' ? 'border-[#315C49] bg-[#12352C] text-white' : 'border-red-200 bg-white text-red-800'}`}>
    <Icon size={20} className="mt-0.5 shrink-0"/>
    <p className="flex-1 text-sm leading-relaxed">{notice.message}</p>
    <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="shrink-0 rounded-md p-1 opacity-75 hover:opacity-100"><X size={16}/></button>
  </div>;
}
