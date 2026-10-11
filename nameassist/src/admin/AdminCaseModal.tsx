/* SIRI.DEV */
import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Building2,
  Calendar,
  CreditCard,
  Send,
  Printer,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { type AdminApplication, type AdminInternalNote, type TrackerStage } from './types';
import { getStoredDocuments } from './adminData';
import { getActiveAdminUser } from './adminAuth';

interface AdminCaseModalProps {
  caseItem: AdminApplication | null;
  onClose: () => void;
  onUpdateApplication: (updated: AdminApplication) => void;
}

export const STAGE_NAMES = [
  'Application Received & Intake Vetting',
  'Document Verification & Legal Drafting',
  'Affidavit Sworn at High Court',
  'Newspaper & Official Gazette Publication',
  'Inter-Agency Dossier Compilation',
  'Certified Documents Dispatched'
];

export function AdminCaseModal({ caseItem, onClose, onUpdateApplication }: AdminCaseModalProps) {
  if (!caseItem) return null;

  const currentUser = getActiveAdminUser();
  const [activeTab, setActiveTab] = useState<'stages' | 'details' | 'notes' | 'documents'>('stages');
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(caseItem.assignedOfficer);
  const [selectedPriority, setSelectedPriority] = useState(caseItem.priority);
  const [customStampCode, setCustomStampCode] = useState('');

  const allDocuments = getStoredDocuments();
  const linkedDocs = allDocuments.filter(d => d.caseId === caseItem.id);

  // Advance stage handler
  const handleAdvanceStage = () => {
    if (caseItem.currentStageIndex >= 5) return;
    const nextIndex = caseItem.currentStageIndex + 1;
    const updatedStages: TrackerStage[] = caseItem.stages.map((stage, idx) => {
      if (idx < nextIndex) {
        return {
          ...stage,
          status: 'completed',
          timestamp: stage.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
          stampCode: stage.stampCode || `NA-STAMP-${caseItem.id.split('-')[2] || 'REG'}`,
          stampLocation: stage.stampLocation || caseItem.jurisdiction
        };
      } else if (idx === nextIndex) {
        return {
          ...stage,
          status: 'current',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
          stampCode: customStampCode.trim() || `HCJ-${caseItem.id.substring(3, 7)}-REV`,
          stampLocation: caseItem.jurisdiction
        };
      } else {
        return { ...stage, status: 'pending' };
      }
    });

    const statusMap: Record<number, AdminApplication['status']> = {
      0: 'intake_vetting',
      1: 'legal_drafting',
      2: 'court_sworn',
      3: 'gazette_published',
      4: 'dossier_compiled',
      5: 'completed'
    };

    const newStatus = statusMap[nextIndex] || 'completed';

    const updated: AdminApplication = {
      ...caseItem,
      currentStageIndex: nextIndex,
      status: newStatus,
      stages: updatedStages,
      internalNotes: [
        {
          id: `note-${Date.now()}`,
          author: currentUser?.name || 'Legal Registrar',
          role: currentUser?.role || 'Officer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
          text: `Stage advanced to: ${STAGE_NAMES[nextIndex]}. Stamp code registered.`
        },
        ...caseItem.internalNotes
      ]
    };

    onUpdateApplication(updated);
    setCustomStampCode('');
  };

  // Revert stage handler
  const handleRevertStage = () => {
    if (caseItem.currentStageIndex <= 0) return;
    const prevIndex = caseItem.currentStageIndex - 1;
    const updatedStages: TrackerStage[] = caseItem.stages.map((stage, idx) => {
      if (idx < prevIndex) return { ...stage, status: 'completed' };
      if (idx === prevIndex) return { ...stage, status: 'current' };
      return { ...stage, status: 'pending' };
    });

    const statusMap: Record<number, AdminApplication['status']> = {
      0: 'intake_vetting',
      1: 'legal_drafting',
      2: 'court_sworn',
      3: 'gazette_published',
      4: 'dossier_compiled',
      5: 'completed'
    };

    const updated: AdminApplication = {
      ...caseItem,
      currentStageIndex: prevIndex,
      status: statusMap[prevIndex] || 'intake_vetting',
      stages: updatedStages,
      internalNotes: [
        {
          id: `note-${Date.now()}`,
          author: currentUser?.name || 'Legal Registrar',
          role: currentUser?.role || 'Officer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
          text: `Stage reverted to: ${STAGE_NAMES[prevIndex]} for supplementary documentation.`
        },
        ...caseItem.internalNotes
      ]
    };

    onUpdateApplication(updated);
  };

  // Add internal note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: AdminInternalNote = {
      id: `note-${Date.now()}`,
      author: currentUser?.name || 'Legal Registrar',
      role: currentUser?.role || 'Officer',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
      text: newNoteText.trim()
    };

    const updated: AdminApplication = {
      ...caseItem,
      internalNotes: [newNote, ...caseItem.internalNotes]
    };

    onUpdateApplication(updated);
    setNewNoteText('');
  };

  // Save metadata changes (officer, priority)
  const handleSaveMetadata = () => {
    const updated: AdminApplication = {
      ...caseItem,
      assignedOfficer: selectedOfficer,
      priority: selectedPriority
    };
    onUpdateApplication(updated);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#12352C] text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-white/20 px-2.5 py-1 rounded text-white tracking-wider">
                {caseItem.id}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  caseItem.priority === 'urgent'
                    ? 'bg-red-500 text-white'
                    : caseItem.priority === 'diaspora_express'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {caseItem.priority.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-[#A9D8C0] font-mono">Ref: {caseItem.officialRefNumber}</span>
            </div>

            <h3 className="mt-2 text-xl font-serif font-bold text-white">{caseItem.applicantName}</h3>
            <p className="text-xs text-[#A9D8C0] mt-0.5">{caseItem.serviceName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
              title="Print Statutory Case Docket"
            >
              <Printer size={14} />
              <span>Print Docket</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[#DCEBE2] bg-[#F7FAF8] px-5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'stages'
                ? 'border-[#006747] text-[#006747]'
                : 'border-transparent text-[#53645D] hover:text-[#12352C]'
            }`}
          >
            Stage Tracker ({caseItem.currentStageIndex + 1}/6)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-[#006747] text-[#006747]'
                : 'border-transparent text-[#53645D] hover:text-[#12352C]'
            }`}
          >
            Applicant & Jurisdiction
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-[#006747] text-[#006747]'
                : 'border-transparent text-[#53645D] hover:text-[#12352C]'
            }`}
          >
            Registry Notes ({caseItem.internalNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-[#006747] text-[#006747]'
                : 'border-transparent text-[#53645D] hover:text-[#12352C]'
            }`}
          >
            Dossier Documents ({linkedDocs.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'stages' && (
            <div className="space-y-6">
              {/* Stage Action Controls */}
              <div className="p-4 rounded-xl bg-[#EDF7F2] border border-[#C5E5D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#006747]">
                    Current Processing Phase
                  </p>
                  <p className="text-sm font-semibold text-[#12352C] mt-0.5">
                    Stage {caseItem.currentStageIndex + 1} of 6: {STAGE_NAMES[caseItem.currentStageIndex]}
                  </p>
                  <p className="text-xs text-[#53645D] mt-0.5">
                    Jurisdiction: {caseItem.jurisdiction}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevertStage}
                    disabled={caseItem.currentStageIndex === 0}
                    className="px-3 py-2 rounded-lg border border-[#CCDAD2] bg-white text-xs font-medium text-[#293B35] hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    ← Revert Stage
                  </button>

                  <button
                    type="button"
                    onClick={handleAdvanceStage}
                    disabled={caseItem.currentStageIndex >= 5}
                    className="px-4 py-2 rounded-lg bg-[#006747] text-xs font-semibold text-white hover:bg-[#12352C] disabled:opacity-40 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Advance to Next Stage</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Six Stages Visualizer */}
              <div className="space-y-3">
                {caseItem.stages.map((stage, idx) => {
                  const isPast = idx < caseItem.currentStageIndex;
                  const isCurrent = idx === caseItem.currentStageIndex;
                  const isFuture = idx > caseItem.currentStageIndex;

                  return (
                    <div
                      key={stage.stageNumber}
                      className={`p-4 rounded-xl border transition ${
                        isCurrent
                          ? 'border-[#006747] bg-white shadow-sm ring-1 ring-[#006747]'
                          : isPast
                          ? 'border-[#DCEBE2] bg-[#F7FAF8]'
                          : 'border-gray-200 bg-gray-50/60 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isPast
                                ? 'bg-[#006747] text-white'
                                : isCurrent
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isPast ? <CheckCircle2 size={16} /> : stage.stageNumber}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-sm font-semibold ${
                                  isCurrent ? 'text-[#12352C]' : isPast ? 'text-[#293B35]' : 'text-gray-500'
                                }`}
                              >
                                {stage.name}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                                  IN PROGRESS
                                </span>
                              )}
                              {isPast && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                                  COMPLETED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#53645D] mt-1 leading-relaxed">{stage.description}</p>

                            {(stage.stampCode || stage.timestamp) && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[#53645D] bg-white/80 p-2 rounded-lg border border-[#E1EDE6]">
                                {stage.timestamp && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock size={12} className="text-[#006747]" />
                                    {stage.timestamp}
                                  </span>
                                )}
                                {stage.stampCode && (
                                  <span className="flex items-center gap-1 font-mono text-[#006747] font-semibold">
                                    <Award size={12} />
                                    Stamp: {stage.stampCode}
                                  </span>
                                )}
                                {stage.stampLocation && (
                                  <span className="text-gray-500">Loc: {stage.stampLocation}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#DCEBE2] bg-[#F7FAF8] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#006747] flex items-center gap-1.5">
                    <User size={14} />
                    Applicant Particulars
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[#53645D]">Full Legal Name:</span>
                      <p className="font-semibold text-[#12352C]">{caseItem.applicantName}</p>
                    </div>
                    <div>
                      <span className="text-[#53645D]">Email Address:</span>
                      <p className="font-mono text-[#12352C]">{caseItem.applicantEmail}</p>
                    </div>
                    <div>
                      <span className="text-[#53645D]">Direct Phone:</span>
                      <p className="font-mono text-[#12352C]">{caseItem.applicantPhone}</p>
                    </div>
                    {caseItem.diasporaDestination && (
                      <div>
                        <span className="text-[#53645D]">Diaspora Address / Hub:</span>
                        <p className="font-semibold text-[#006747]">{caseItem.diasporaDestination}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#DCEBE2] bg-[#F7FAF8] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#006747] flex items-center gap-1.5">
                    <Building2 size={14} />
                    Statutory & Registry Data
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[#53645D]">Judicial Division:</span>
                      <p className="font-semibold text-[#12352C]">{caseItem.jurisdiction}</p>
                    </div>
                    <div>
                      <span className="text-[#53645D]">Official Court Filing Ref:</span>
                      <p className="font-mono font-bold text-[#006747]">{caseItem.officialRefNumber}</p>
                    </div>
                    <div>
                      <span className="text-[#53645D]">Gazette Reference No:</span>
                      <p className="font-mono text-[#12352C]">{caseItem.gazetteNoticeRef || 'Pending Gazette Publication'}</p>
                    </div>
                    <div>
                      <span className="text-[#53645D]">Filing Date & SLA:</span>
                      <p className="font-mono text-[#12352C]">
                        {caseItem.filingDate} → Target: {caseItem.estimatedCompletion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Reassignment & Priority Controls */}
              <div className="p-4 rounded-xl border border-[#CCDAD2] bg-white space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#12352C]">
                  Administrative Assignment & Triage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#293B35]">Assigned Legal Officer</label>
                    <select
                      value={selectedOfficer}
                      onChange={e => setSelectedOfficer(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                    >
                      <option value="Barr. Chinedu Obi (Senior Legal Registrar)">Barr. Chinedu Obi (Senior Legal Registrar)</option>
                      <option value="Funke Balogun (Diaspora Legal Lead)">Funke Balogun (Diaspora Legal Lead)</option>
                      <option value="Barr. Amina Al-Hassan (Corporate Counsel)">Barr. Amina Al-Hassan (Corporate Counsel)</option>
                      <option value="Mallam Ibrahim Sani (Registrar)">Mallam Ibrahim Sani (Registrar)</option>
                      <option value="Inspector Solomon G. (Liaison Officer)">Inspector Solomon G. (Liaison Officer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#293B35]">Processing Priority Tier</label>
                    <select
                      value={selectedPriority}
                      onChange={e => setSelectedPriority(e.target.value as AdminApplication['priority'])}
                      className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                    >
                      <option value="normal">Normal (Standard Statutory Turnaround)</option>
                      <option value="urgent">Urgent (Expedited High Court Slot)</option>
                      <option value="diaspora_express">Diaspora Express (DHL Diplomatic Pouch)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveMetadata}
                    className="px-4 py-2 rounded-lg bg-[#12352C] text-xs font-semibold text-white hover:bg-[#006747] transition shadow-sm"
                  >
                    Save Case Assignment
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="p-4 rounded-xl border border-[#CCDAD2] bg-white space-y-3">
                <label className="block text-xs font-semibold text-[#12352C]">
                  Add Officer Registry Minute / Internal Note
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Record registry action, court clerk confirmation, newspaper clipping date, or biometric query..."
                  className="w-full rounded-lg border border-[#CCDAD2] p-3 text-xs focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-4 py-2 rounded-lg bg-[#006747] text-white text-xs font-semibold hover:bg-[#12352C] disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Post Minute to Docket</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#53645D]">
                  Docket Audit Minutes ({caseItem.internalNotes.length})
                </p>
                {caseItem.internalNotes.map(note => (
                  <div key={note.id} className="p-3.5 rounded-xl border border-[#DCEBE2] bg-[#F7FAF8]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#12352C]">{note.author}</span>
                        <span className="text-[10px] bg-[#EDF7F2] text-[#006747] font-medium px-2 py-0.5 rounded">
                          {note.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#53645D] font-mono">{note.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#293B35] mt-2 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#53645D]">
                  Linked Filing Dossier ({linkedDocs.length} Documents)
                </p>
              </div>

              {linkedDocs.length === 0 ? (
                <div className="p-8 text-center bg-[#F7FAF8] rounded-xl border border-[#DCEBE2]">
                  <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-[#53645D]">No specific documents mapped to this case ref yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {linkedDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-[#DCEBE2] bg-white flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center shrink-0 mt-0.5">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#12352C] truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#53645D]">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{doc.category}</span>
                            <span>{doc.fileSize}</span>
                            <span className="font-mono text-[#006747]">{doc.sealNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            doc.status === 'ready' || doc.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-900'
                              : doc.status === 'pending_review'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {doc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-[#DCEBE2] bg-[#F7FAF8] px-6 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#53645D]">
            <ShieldCheck size={14} className="text-[#006747]" />
            <span>Encrypted Case Docket • Evidence Act 2011 Verified</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
          >
            Close Docket
          </button>
        </div>
      </div>
    </div>
  );
}
