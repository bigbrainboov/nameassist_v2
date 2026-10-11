/* SIRI.DEV */
import React, { useEffect, useRef } from 'react';
import { type ServiceItem } from '../types';
import { X, Check, ArrowRight } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onApply: (service: ServiceItem) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose, onApply }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!service || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [service]);

  if (!service) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="service-detail-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-[#293B35] shadow-xl backdrop:bg-[#12352C]/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 id="service-detail-title" className="text-2xl font-semibold tracking-tight text-[#12352C]">
            {service.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close service details"
            className="shrink-0 rounded-lg p-2 text-[#53645D] hover:bg-[#EDF7F2] focus-visible:outline-2 focus-visible:outline-[#006747] cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <section aria-labelledby="service-price-title" className="rounded-xl bg-[#EDF7F2] p-5 mb-6">
          <h3 id="service-price-title" className="text-sm font-medium text-[#53645D] mb-2">Pricing</h3>
          <p className="text-3xl font-semibold text-[#006747]">
            {service.feeNgn} <span className="text-base font-normal text-[#53645D]">/ {service.feeGbp}</span>
          </p>
        </section>

        <section aria-labelledby="service-documents-title">
          <h3 id="service-documents-title" className="font-semibold text-[#12352C] mb-3">Required Applicant Documents</h3>
          <ul className="space-y-3">
            {service.requiredDocuments.map((document) => (
              <li key={document} className="flex items-start gap-3 text-sm leading-relaxed text-[#53645D]">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#006747]" />
                <span>{document}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-7 border-t border-[#E8EEEA] pt-5">
          <p className="mb-4 text-sm text-[#53645D]">Apply from your dashboard. Sign in or create an account to continue.</p>
          <button type="button" onClick={() => { onClose(); onApply(service); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b4834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006747] cursor-pointer">
            Proceed with application <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </dialog>
  );
};
