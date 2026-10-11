/* SIRI.DEV */
import React, { useState } from 'react';
import { X, Download, ShieldCheck, CheckCircle2, FileText, Share2, Copy } from 'lucide-react';
import { type UserDocumentItem } from '../types';
import { StampSeal } from '../components/StampSeal';

interface DocumentPreviewModalProps {
  document: UserDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: docItem,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !docItem) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Simulated instant download of official PDF extract
    const element = window.document.createElement('a');
    const file = new Blob([
      `FEDERAL REPUBLIC OF NIGERIA - OFFICIAL DOCUMENT RECORD\n` +
      `Title: ${docItem.name}\n` +
      `Category: ${docItem.category}\n` +
      `Case ID: ${docItem.caseId}\n` +
      `Seal Reference: ${docItem.sealNumber}\n` +
      `Issuing Authority: ${docItem.sealAuthority}\n` +
      `Issued Date: ${docItem.issueDate}\n` +
      `Status: VERIFIED & SEALED\n\n` +
      `Description: ${docItem.description}\n` +
      `Certified through NameAssist Legal Documentation Portal.\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${docItem.name.replace(/\s+/g, '_')}_${docItem.caseId}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12352C]/65 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#DCEBE2] rounded-2xl shadow-2xl overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
      >
        {/* Header */}
        <div className="bg-[#00513B] text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded font-semibold text-white">
                {docItem.category}
              </span>
              <span className="text-[11px] bg-[#A9D8C0] text-[#00513B] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck size={12} /> {docItem.status === 'verified' ? 'Court Verified' : 'Ready'}
              </span>
            </div>
            <h3 id="doc-preview-title" className="text-lg sm:text-xl font-semibold !text-white pt-1">
              {docItem.name}
            </h3>
            <p className="text-xs text-[#D1E5DA]">
              Case Reference: <span className="font-mono text-white font-medium">{docItem.caseId}</span> · {docItem.fileSize}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Document Presentation Canvas */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Paper Simulated Preview Card */}
          <div className="relative bg-[#FBFDFB] border-2 border-[#D8E6DE] rounded-xl p-6 sm:p-8 shadow-inner space-y-5 text-left font-sans">
            {/* Stamp Overlay Top Right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none opacity-85">
              <StampSeal
                text="FEDERAL HIGH COURT"
                subtext="SEALED & CERTIFIED"
                centerText="VERIFIED"
                variant={docItem.category === 'Affidavit' ? 'red' : 'green'}
                size="md"
              />
            </div>

            {/* Official Header */}
            <div className="border-b border-gray-200 pb-4 max-w-md">
              <span className="text-[10px] tracking-widest uppercase font-bold text-[#006747] block">
                Federal Republic of Nigeria
              </span>
              <h4 className="text-base font-semibold text-[#102B23] mt-0.5">
                {docItem.sealAuthority}
              </h4>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                Official Serial No: {docItem.sealNumber}
              </p>
            </div>

            {/* Document Particulars */}
            <div className="space-y-3 text-xs text-[#293B35]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-[11px]">Date of Certification</span>
                  <strong className="text-gray-800 font-medium">{docItem.issueDate}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Verification Code</span>
                  <strong className="text-[#006747] font-mono font-medium">{docItem.sealNumber}</strong>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px] mb-1">Scope of Declaration / Publication</span>
                <p className="p-3 bg-white border border-[#E2ECE6] rounded-lg text-xs leading-relaxed text-[#293B35]">
                  {docItem.description}
                </p>
              </div>

              <div className="bg-[#EDF7F2] p-3 rounded-lg flex items-center gap-2.5 text-xs text-[#006747]">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  This digital excerpt is certified in compliance with the Evidence Act 2011 and acceptable for consular legalisation, NIS passport updates, and commercial banking.
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#006747] transition py-2 px-3 border border-gray-200 rounded-lg hover:border-[#006747]"
            >
              <Copy size={13} />
              {copied ? 'Link Copied!' : 'Copy Verification Reference'}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 text-xs font-medium text-white bg-[#006747] hover:bg-[#00513B] rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} />
                Download Certified Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
