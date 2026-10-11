/* SIRI.DEV */
import React from 'react';
import { X, Calendar, MapPin, Award, CheckCircle2, Clock, ArrowRight, Download, ExternalLink, MessageCircle, FileText } from 'lucide-react';
import { type ApplicationCase } from '../types';
import { StampSeal } from '../components/StampSeal';

interface CaseDetailModalProps {
  application: ApplicationCase | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDocuments?: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onNavigateToDocuments
}) => {
  if (!isOpen || !application) return null;

  const currentStage = application.stages[application.currentStageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12352C]/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-[#FFFFFF] border border-[#DCEBE2] rounded-2xl shadow-2xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
      >
        {/* Modal Header */}
        <div className="bg-[#00513B] text-white p-6 sm:p-7 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs bg-white/20 px-2.5 py-1 rounded tracking-wider uppercase font-semibold">
                {application.id}
              </span>
              <span className="text-xs bg-[#A9D8C0] text-[#00513B] font-medium px-2 py-0.5 rounded">
                {application.category}
              </span>
            </div>
            <h3 id="case-title" className="text-xl sm:text-2xl font-semibold !text-white pt-1">
              {application.serviceName}
            </h3>
            <p className="text-xs sm:text-sm text-[#D1E5DA]">
              Applicant: <strong className="text-white">{application.applicantName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7FAF8] border border-[#E5ECE8] rounded-xl p-4 text-xs">
            <div>
              <span className="text-gray-500 block mb-0.5">Jurisdiction</span>
              <strong className="text-[#102B23] font-medium flex items-center gap-1">
                <MapPin size={13} className="text-[#006747]" />
                {application.jurisdiction}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Filing Date</span>
              <strong className="text-[#102B23] font-medium flex items-center gap-1">
                <Calendar size={13} className="text-[#006747]" />
                {application.filingDate}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Estimated Delivery</span>
              <strong className="text-[#102B23] font-medium flex items-center gap-1">
                <Clock size={13} className="text-[#006747]" />
                {application.estimatedCompletion}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Official Court Ref</span>
              <strong className="text-[#006747] font-mono text-[11px] truncate block" title={application.officialRefNumber}>
                {application.officialRefNumber}
              </strong>
            </div>
          </div>

          {/* Current Stage Highlight with Seal */}
          <div className="border-2 border-[#006747]/20 bg-[#EDF7F2]/40 rounded-xl p-5 relative overflow-hidden flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div className="space-y-1.5 max-w-lg">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#006747] bg-[#EDF7F2] px-2 py-0.5 rounded">
                Current Milestone: Stage {application.currentStageIndex + 1} of {application.stages.length}
              </span>
              <h4 className="text-lg font-semibold text-[#102B23]">
                {currentStage?.name}
              </h4>
              <p className="text-xs text-[#53645D] leading-relaxed">
                {currentStage?.description}
              </p>
              {currentStage?.timestamp && (
                <p className="text-[11px] text-gray-500 pt-1">
                  Last verified: <strong>{currentStage.timestamp}</strong> · {currentStage.stampLocation}
                </p>
              )}
            </div>

            <div className="shrink-0 self-center sm:self-auto">
              <StampSeal
                text="HIGH COURT OF JUSTICE"
                subtext="FEDERAL REPUBLIC OF NIGERIA"
                centerText={currentStage?.stampCode || 'VERIFIED'}
                variant={application.currentStageIndex >= 4 ? 'green' : 'red'}
                size="md"
              />
            </div>
          </div>

          {/* Stepper Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-[#102B23] mb-4">Official Verification Timeline</h4>
            <div className="space-y-4">
              {application.stages.map((stage, idx) => {
                const isPast = idx < application.currentStageIndex;
                const isCurrent = idx === application.currentStageIndex;
                return (
                  <div key={stage.stageNumber} className="flex gap-3.5 items-start">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isPast
                          ? 'bg-[#006747] text-white'
                          : isCurrent
                          ? 'bg-[#FDF3E7] text-[#B86B14] border-2 border-[#B86B14]'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isPast ? <CheckCircle2 size={16} /> : stage.stageNumber}
                      </div>
                      {idx < application.stages.length - 1 && (
                        <div className={`w-0.5 h-10 mt-1 ${isPast ? 'bg-[#006747]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h5 className={`text-xs font-semibold ${isCurrent ? 'text-[#B86B14]' : isPast ? 'text-[#102B23]' : 'text-gray-400'}`}>
                          Stage {stage.stageNumber}: {stage.name}
                        </h5>
                        {stage.timestamp && (
                          <span className="text-[10px] text-gray-500 font-mono">
                            {stage.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                      {stage.stampCode && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono font-medium text-gray-700">
                            Ref: {stage.stampCode}
                          </span>
                          <span>{stage.stampLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-4 border-t border-[#E5ECE8] flex flex-wrap gap-3 items-center justify-between">
            <a
              href={`https://wa.me/2348142009941?text=Hello%20NameAssist%20Legal%2C%20I%20am%20inquiring%20about%20my%20case%20file%20${application.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#006747] hover:underline"
            >
              <MessageCircle size={15} />
              Chat with Case Officer on WhatsApp ↗
            </a>

            <div className="flex items-center gap-2">
              {onNavigateToDocuments && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDocuments();
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-[#006747] bg-[#EDF7F2] hover:bg-[#d8ece1] rounded-lg transition flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  View Associated Documents
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 text-xs font-medium text-white bg-[#006747] hover:bg-[#00513B] rounded-lg transition flex items-center gap-1.5"
              >
                <Download size={14} />
                Print Acknowledgment
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
