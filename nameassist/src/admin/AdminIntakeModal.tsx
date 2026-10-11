/* SIRI.DEV */
import React, { useState } from 'react';
import { X, PlusCircle, Building2, User, Mail, Phone, Globe, ShieldCheck } from 'lucide-react';
import { type AdminApplication, type TrackerStage } from './types';
import { getActiveAdminUser } from './adminAuth';

interface AdminIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateApplication: (newApp: AdminApplication) => void;
}

const SERVICE_OPTIONS = [
  {
    id: 'change-of-name',
    name: 'Change of Name (Post-Marital Transition)',
    category: 'Identity & Name' as const,
    fee: '₦45,000'
  },
  {
    id: 'name-correction',
    name: 'Name Correction & WAEC/Degree Reconciliation',
    category: 'Education' as const,
    fee: '₦48,000'
  },
  {
    id: 'affidavit-declaration',
    name: 'Statutory Declaration of Marital Status & Deed Poll',
    category: 'Personal Documents' as const,
    fee: '₦22,000'
  },
  {
    id: 'birth-documentation',
    name: 'NPC Attestation of Birth & Statutory Age Declaration',
    category: 'Personal Documents' as const,
    fee: '₦35,000'
  },
  {
    id: 'cac-harmonisation',
    name: 'CAC Director Harmonisation Form 7A Status Report',
    category: 'Business & CAC' as const,
    fee: '₦52,000'
  },
  {
    id: 'passport-support',
    name: 'NIS Passport Support Dossier & Police Clearance',
    category: 'Passport & Travel' as const,
    fee: '₦42,000'
  }
];

export function AdminIntakeModal({ isOpen, onClose, onCreateApplication }: AdminIntakeModalProps) {
  if (!isOpen) return null;

  const currentUser = getActiveAdminUser();
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [serviceId, setServiceId] = useState('change-of-name');
  const [jurisdiction, setJurisdiction] = useState('High Court of Lagos State (Ikeja Judicial Division)');
  const [priority, setPriority] = useState<AdminApplication['priority']>('normal');
  const [diasporaDestination, setDiasporaDestination] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState(
    currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Barr. Chinedu Obi (Senior Legal Registrar)'
  );

  const selectedServiceObj = SERVICE_OPTIONS.find(s => s.id === serviceId) || SERVICE_OPTIONS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const stateCode = jurisdiction.includes('Lagos')
      ? 'LAG'
      : jurisdiction.includes('FCT') || jurisdiction.includes('Abuja')
      ? 'ABJ'
      : jurisdiction.includes('Rivers')
      ? 'PHC'
      : 'NG';

    const caseId = `NA-2026-${randomSuffix}-${stateCode}`;
    const todayStr = new Date().toISOString().substring(0, 10);
    const targetDate = new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10);

    const initialStages: TrackerStage[] = [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Case file officially opened by registry desk. Initial document assessment underway.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
        stampCode: `REC-${stateCode}-${randomSuffix.toString().substring(0, 2)}`,
        stampLocation: jurisdiction,
        status: 'current'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Statutory declaration and deed poll drafting.',
        status: 'pending'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Execution before High Court Commissioner for Oaths.',
        status: 'pending'
      },
      {
        stageNumber: 4,
        name: 'Newspaper & Official Gazette Publication',
        description: 'Public advertisement in national daily and Federal Gazette docketing.',
        status: 'pending'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Assembly of authenticated seals for immigration / banking.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Expedited courier delivery to applicant.',
        status: 'pending'
      }
    ];

    const newApp: AdminApplication = {
      id: caseId,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: applicantPhone.trim() || '+234 800 000 0000',
      serviceId: selectedServiceObj.id,
      serviceName: selectedServiceObj.name,
      category: selectedServiceObj.category,
      jurisdiction,
      filingDate: todayStr,
      estimatedCompletion: targetDate,
      currentStageIndex: 0,
      stages: initialStages,
      status: 'intake_vetting',
      priority,
      assignedOfficer,
      feeNgn: selectedServiceObj.fee,
      paymentStatus: 'paid',
      officialRefNumber: `HCJ/${stateCode}/DECL/2026/${randomSuffix}`,
      diasporaDestination: diasporaDestination.trim() || undefined,
      internalNotes: [
        {
          id: `note-${Date.now()}`,
          author: currentUser?.name || 'Legal Registrar',
          role: currentUser?.role || 'Staff Officer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
          text: 'Case created via manual registry intake. Identity data logged and placed on legal queue.'
        }
      ]
    };

    onCreateApplication(newApp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden">
        <div className="bg-[#12352C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#006747] flex items-center justify-center text-white">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">New Statutory Case Intake</h3>
              <p className="text-xs text-[#A9D8C0]">Manual walk-in, consular dispatch, or staff-assisted filing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Applicant info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#006747] flex items-center gap-1.5">
              <User size={14} />
              Applicant Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#293B35]">Applicant Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwaseun Michael Babalola"
                  value={applicantName}
                  onChange={e => setApplicantName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. seun.babalola@outlook.com"
                  value={applicantEmail}
                  onChange={e => setApplicantEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +234 802 334 1190 or +44 7..."
                  value={applicantPhone}
                  onChange={e => setApplicantPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">
                  Diaspora Destination Hub (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. London UK, Toronto CA, Houston USA"
                  value={diasporaDestination}
                  onChange={e => setDiasporaDestination(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Service & Jurisdiction */}
          <div className="space-y-3 pt-3 border-t border-[#EDF3F0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#006747] flex items-center gap-1.5">
              <Building2 size={14} />
              Service & Statutory Jurisdiction
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#293B35]">Required Legal Service</label>
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                >
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.fee})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Judicial Division / Jurisdiction</label>
                <select
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                >
                  <option value="High Court of Lagos State (Ikeja Judicial Division)">
                    High Court of Lagos State (Ikeja Division)
                  </option>
                  <option value="FCT High Court of Justice, Maitama Abuja">
                    FCT High Court of Justice, Abuja
                  </option>
                  <option value="Rivers State High Court of Justice, Port Harcourt">
                    Rivers State High Court, Port Harcourt
                  </option>
                  <option value="Kano State High Court of Justice (Miller Road Division)">
                    Kano State High Court, Kano
                  </option>
                  <option value="National Population Commission (NPC) HQ Abuja">
                    National Population Commission (NPC) HQ Abuja
                  </option>
                  <option value="Corporate Affairs Commission (CAC) Headquarters Abuja">
                    Corporate Affairs Commission (CAC) HQ Abuja
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Priority Tier</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as AdminApplication['priority'])}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                >
                  <option value="normal">Normal (Standard Processing)</option>
                  <option value="urgent">Urgent (Express High Court Commissioner)</option>
                  <option value="diaspora_express">Diaspora Express (DHL Air Express)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Assigned Legal Officer</label>
                <input
                  type="text"
                  value={assignedOfficer}
                  onChange={e => setAssignedOfficer(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#EDF7F2] rounded-xl border border-[#C5E5D5] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#53645D]">Statutory Filing Fee:</span>
              <span className="font-bold text-[#12352C] ml-1.5">{selectedServiceObj.fee}</span>
            </div>
            <span className="text-[11px] bg-white border border-[#006747]/30 text-[#006747] font-semibold px-2 py-0.5 rounded">
              Paid / Direct Receipt
            </span>
          </div>

          <div className="pt-3 border-t border-[#EDF3F0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#CCDAD2] text-xs font-semibold text-[#53645D] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#006747] text-white text-xs font-semibold hover:bg-[#12352C] transition shadow-sm"
            >
              Open Official Docket & Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
