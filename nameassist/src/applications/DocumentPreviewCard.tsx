/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { ApiError, authenticatedRequest } from '../auth/api';
import { Dialog } from '../components/Dialog';
import { createDocumentPreview, type DocumentPreview, fileSizeLabel } from './documentPreview';
import { readPreview } from './previewCache';

function DocumentMedia({ preview, name, expanded = false }: {
  preview: DocumentPreview; name: string; expanded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="p-5 text-center text-sm text-[#53645D]">This preview could not be displayed. Download the file to open it on your device.</p>;
  if (preview.kind === 'image') return <img src={preview.url} alt={expanded ? name : ''}
    onError={() => setFailed(true)} className={expanded ? 'mx-auto max-h-[65dvh] max-w-full object-contain' : 'h-52 w-full object-contain p-4'}/>;
  if (expanded) return <iframe title={`${name} PDF preview`} src={`${preview.url}#view=FitH`}
    className="h-[65dvh] min-h-64 w-full border-0"/>;
  return <object type="application/pdf" data={`${preview.url}#page=1&toolbar=0&navpanes=0&view=FitH`}
    tabIndex={-1} className="h-52 w-full pointer-events-none" onError={() => setFailed(true)}>
    <div className="flex h-52 flex-col items-center justify-center gap-2 text-[#53645D]">
      <FileText size={38} strokeWidth={1.2} className="text-[#006747]"/>
      <p className="text-xs">PDF document</p>
    </div>
  </object>;
}

const loadCustomerDocument = (id: string) => authenticatedRequest<Blob>(`/documents/${id}/content/`, undefined, 'blob');

export function DocumentPreviewCard({ source, name, description, onRemove, loadDocument = loadCustomerDocument,
  version, badge, subtitle, actions, onFeedback }: {
  source: File | string; name: string; description?: React.ReactNode; onRemove?: () => void;
  loadDocument?: (id: string) => Promise<Blob>; version?: string;
  badge?: string; subtitle?: string;
  actions?: (download: () => void, downloading: boolean) => React.ReactNode;
  onFeedback?: (message: string) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(typeof source !== 'string');
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ source: File | string; version?: string; blob: Blob; preview: DocumentPreview } | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const preview = loaded?.source === source && loaded.version === version ? loaded.preview : null;

  useEffect(() => {
    if (visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '150px' });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);

  function loadBlob() {
    if (typeof source !== 'string') return Promise.resolve(source);
    return version && loadDocument === loadCustomerDocument
      ? readPreview({ id: source, updated_at: version }, () => loadDocument(source))
      : loadDocument(source);
  }

  useEffect(() => {
    if (!visible) return;
    let active = true;
    let resource: DocumentPreview | undefined;
    setLoaded(null); setError(''); setDownloadError('');
    loadBlob().then(async blob => {
      const result = await createDocumentPreview(blob);
      if (!active) { result.dispose(); return; }
      resource = result;
      setLoaded({ source, version, blob, preview: result });
    }).catch(failure => {
      if (active) setError(failure instanceof ApiError && failure.status === 404
        ? 'This file is unavailable. You can replace it with a new upload.'
        : failure instanceof Error ? failure.message : 'Unable to load this preview. Please retry.');
    });
    return () => { active = false; resource?.dispose(); };
  }, [source, version, visible, attempt, loadDocument]);

  const filename = typeof source !== 'string' ? source.name : /\.(pdf|jpe?g|png)$/i.test(name) ? name : `${name}${preview?.extension || ''}`;
  async function download() {
    if (downloading) return;
    setDownloading(true); setDownloadError('');
    try {
      const blob = preview && loaded ? loaded.blob : await loadBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Unable to download. Please retry.';
      setDownloadError(message); onFeedback?.(message);
    } finally { setDownloading(false); }
  }

  return <article ref={containerRef} className="group min-w-0 rounded-2xl border border-[#E0E8E3] bg-white shadow-sm transition-shadow hover:shadow-md">
    <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-t-2xl border-b border-[#E5ECE8] bg-[#F1F5F2]">
      {preview ? <>
        <div aria-hidden="true" inert className="w-full"><DocumentMedia key={preview.url} preview={preview} name={name}/></div>
        <button type="button" onClick={() => setExpanded(true)} aria-label={`Preview ${name}`} className="absolute inset-0 flex items-center justify-center bg-transparent transition-colors hover:bg-[#12352C]/10 focus-visible:bg-[#12352C]/10">
          <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#006747] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><Eye size={15}/>Open preview</span>
        </button>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/70 bg-white/95 px-2 py-1 text-[10px] font-semibold tracking-wide text-[#53645D]">{preview.extension.slice(1).toUpperCase()}</span>
      </> : error ? <div className="px-5 text-center"><FileText size={30} strokeWidth={1.3} className="mx-auto mb-3 text-[#81948A]"/><p className="text-xs leading-relaxed text-[#53645D]">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006747]"><RotateCcw size={13}/>Retry preview</button></div>
        : <p role="status" className="flex items-center gap-2 text-xs text-[#53645D]"><LoaderCircle size={16} className="animate-spin"/>Loading preview…</p>}
      {badge && <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#006747] shadow-sm">{badge}</span>}
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><h3 title={name} className="truncate text-sm font-semibold text-[#293B35]">{name}</h3>
          {subtitle && <p className="mt-1 truncate text-xs text-[#53645D]">{subtitle}</p>}
          <p className="mt-1 text-[11px] text-[#819087]">{preview ? fileSizeLabel(preview.size) : typeof source !== 'string' ? fileSizeLabel(source.size) : 'Private document'}</p>
        </div>
        {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"><X size={16}/></button>}
      </div>
      {description && <div className="mt-3 text-xs text-[#53645D]">{description}</div>}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EDF1EE] pt-3">
        <button type="button" onClick={() => setExpanded(true)} disabled={!preview} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#006747] hover:bg-[#EDF7F2] disabled:cursor-not-allowed disabled:text-gray-400"><Eye size={14}/>Preview</button>
        {actions ? actions(() => void download(), downloading) : typeof source === 'string' && <button type="button" onClick={download} disabled={downloading} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#53645D] hover:bg-[#F4F7F5] disabled:opacity-50"><Download size={14}/>{downloading ? 'Downloading…' : 'Download'}</button>}
      </div>
      {downloadError && !onFeedback && <p role="alert" className="mt-2 text-xs text-red-700">{downloadError}</p>}
    </div>
    {expanded && preview && <Dialog title={name} onClose={() => setExpanded(false)}>
      <div className="overflow-hidden rounded-xl border border-[#E5ECE8] bg-[#F4F7F5]"><DocumentMedia key={preview.url} preview={preview} name={name} expanded/></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-xs text-[#53645D]">{preview.extension.slice(1).toUpperCase()} · {fileSizeLabel(preview.size)}</p>
        <div className="flex items-center gap-4">{preview.kind === 'pdf' && <a href={preview.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#006747]">Open PDF ↗</a>}
          <button type="button" onClick={download} disabled={downloading} className="flex items-center gap-2 rounded-lg bg-[#006747] px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Download size={16}/>{downloading ? 'Downloading…' : 'Download'}</button>
        </div>
      </div>
      {downloadError && <p role="alert" className="mt-3 text-sm text-red-700">{downloadError}</p>}
    </Dialog>}
  </article>;
}
