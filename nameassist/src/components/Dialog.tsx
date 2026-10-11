/* SIRI.DEV */
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { lockDialogScroll } from './dialogScrollLock';

export function Dialog({ title, onClose, busy = false, children, variant = 'default', subtitle }: {
  variant?: 'default' | 'admin'; subtitle?: React.ReactNode;
  title: string; onClose: () => void; busy?: boolean; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const unlockScroll = lockDialogScroll();
    return () => { dialog.close(); unlockScroll(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId}
    onCancel={e => { e.preventDefault(); e.stopPropagation(); if (!busy) onClose(); }}
    className={`fixed inset-0 m-auto w-[calc(100%-2rem)] ${variant === 'admin' ? 'max-w-4xl border border-[#DCEBE2]' : 'max-w-3xl'} max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-[#293B35] shadow-xl backdrop:bg-[#12352C]/70 backdrop:backdrop-blur-sm`}>
    <header className={`sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5ECE8] px-6 py-5 ${variant === 'admin' ? 'bg-[#12352C] text-white' : 'bg-white'}`}>
      <div className="min-w-0 flex-1"><h2 id={titleId} className={`break-words text-xl ${variant === 'admin' ? 'font-serif font-bold !text-white' : 'font-semibold text-[#102B23]'}`}>{title}</h2>{subtitle && <div className="mt-2 text-xs text-[#A9D8C0]">{subtitle}</div>}</div>
      <button type="button" disabled={busy} onClick={onClose} aria-label="Close dialog" className={`shrink-0 rounded-lg p-2 disabled:opacity-40 ${variant === 'admin' ? 'bg-white/10 hover:bg-white/20 text-white' : 'hover:bg-[#EDF7F2]'}`}><X size={20}/></button>
    </header>
    <div className={variant === 'admin' ? 'p-0' : 'p-6 sm:p-8'}>{children}</div>
  </dialog>;
}
