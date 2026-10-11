/* SIRI.DEV */
import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Award, ShieldCheck, Download, AlertCircle, FileText, Printer } from 'lucide-react';
import { type AdminDocument } from './types';

interface AdminDocPreviewModalProps {
  document: AdminDocument | null;
  onClose: () => void;
  onUpdateDocument: (updated: AdminDocument) => void;
}

export function AdminDocPreviewModal({ document, onClose, onUpdateDocument }: AdminDocPreviewModalProps) {
  if (!document) return null;

  const [reviewNote, setReviewNote] = useState(document.reviewNotes || '');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    const updated: AdminDocument = {
      ...document,
      status: 'verified',
      reviewNotes: reviewNote.trim() || 'Verified authentic by legal operations desk.'
    };
    onUpdateDocument(updated);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    const updated: AdminDocument = {
      ...document,
      status: 'rejected',
      reviewNotes: `REJECTED / ACTION REQUIRED: ${rejectReason.trim()}`
    };
    onUpdateDocument(updated);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#12352C] text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded text-white">
                {document.caseId}
              </span>
              <span className="text-xs text-[#A9D8C0] font-mono">{document.fileSize}</span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">{document.name}</h3>
            <p className="text-xs text-[#A9D8C0]">Applicant: {document.applicantName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
              title="Print Document"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Inspection Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F2F6F4] flex flex-col items-center">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-md border-2 border-[#DCEBE2] p-8 space-y-6 relative overflow-hidden text-center">
            {/* Judicial Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
              <span className="text-6xl font-serif font-black uppercase text-[#12352C] rotate-[-25deg]">
                AUTHENTICATED
              </span>
            </div>

            {/* Header Crest Simulation */}
            <div className="border-b-2 border-[#12352C] pb-4">
              <p className="text-[11px] font-serif uppercase tracking-widest text-[#12352C] font-bold">
                Federal Republic of Nigeria
              </p>
              <h4 className="text-base font-serif font-bold text-[#12352C] mt-0.5">
                {document.sealAuthority.toUpperCase()}
              </h4>
              <p className="text-[10px] text-[#53645D] font-mono mt-1">
                AUTHENTICATION SEAL REF: {document.sealNumber}
              </p>
            </div>

            {/* Document Content Simulation */}
            <div className="text-left space-y-3 py-2 text-xs leading-relaxed text-[#293B35]">
              <div className="p-3 bg-[#F7FAF8] rounded-lg border border-[#E1EDE6]">
                <p className="font-semibold text-[#12352C]">Document Title:</p>
                <p className="text-[#006747] font-medium">{document.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#53645D]">Document Type:</span>
                  <p className="font-semibold">{document.category}</p>
                </div>
                <div>
                  <span className="text-[#53645D]">Date Logged:</span>
                  <p className="font-semibold">{document.submittedDate}</p>
                </div>
              </div>

              <p className="italic text-[#53645D] pt-2 border-t border-gray-100">
                "{document.description}"
              </p>
            </div>

            {/* Red Wax / Gold Embossed Seal Emblem */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-[#53645D]">Registry Verification Mark</p>
                <p className="text-xs font-mono font-bold text-[#006747]">{document.sealNumber}</p>
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-amber-800 shadow-inner">
                <Award size={20} className="text-amber-700" />
                <span className="text-[8px] font-bold uppercase tracking-tighter">OFFICIAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Controls / Action Footer */}
        <div className="border-t border-[#DCEBE2] bg-white p-5 space-y-3">
          {showRejectForm ? (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
              <p className="text-xs font-bold text-red-900 flex items-center gap-1">
                <AlertCircle size={14} />
                Reason for Document Clarification / Rejection
              </p>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Scanned image resolution is blurred; signature page missing; please re-upload in high resolution..."
                className="w-full text-xs p-2 rounded border border-red-300 outline-none bg-white resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1 text-xs rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Send Re-upload Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={16} className="text-[#006747]" />
                <span className="text-[#53645D]">
                  Current Status:{' '}
                  <strong className="text-[#12352C] uppercase">{document.status.replace('_', ' ')}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Request Re-upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-lg bg-[#006747] hover:bg-[#12352C] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve & Affix Stamp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
