/* SIRI.DEV */
import { type ServiceCategory, type TrackerStage } from '../types';
export type { ServiceCategory, TrackerStage };

export type AdminApplicationStatus =
  | 'intake_vetting'
  | 'legal_drafting'
  | 'court_sworn'
  | 'gazette_published'
  | 'dossier_compiled'
  | 'dispatched'
  | 'completed'
  | 'action_required';

export interface AdminInternalNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface AdminApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  jurisdiction: string;
  filingDate: string;
  estimatedCompletion: string;
  currentStageIndex: number;
  stages: TrackerStage[];
  status: AdminApplicationStatus;
  priority: 'normal' | 'urgent' | 'diaspora_express';
  assignedOfficer: string;
  feeNgn: string;
  paymentStatus: 'paid' | 'pending' | 'receipt_issued';
  officialRefNumber: string;
  diasporaDestination?: string;
  gazetteNoticeRef?: string;
  internalNotes: AdminInternalNote[];
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  countryCode: string;
  joinedDate: string;
  activeCasesCount: number;
  totalSpentNgn: string;
  status: 'verified' | 'pending_verification' | 'flagged';
  ninOrPassport: string;
  linkedCaseIds: string[];
}

export interface AdminDocument {
  id: string;
  name: string;
  category: 'Affidavit' | 'Gazette Notice' | 'NPC Certificate' | 'MoFA Legalisation' | 'CAC Filing' | 'ID Proof';
  caseId: string;
  applicantName: string;
  submittedDate: string;
  fileSize: string;
  status: 'pending_review' | 'verified' | 'ready' | 'rejected';
  sealAuthority: string;
  sealNumber: string;
  isDeliverable: boolean;
  downloadUrl?: string;
  description: string;
  reviewNotes?: string;
}

export interface AdminPayment {
  id: string;
  caseId: string;
  applicantName: string;
  service: string;
  date: string;
  amountNgn: string;
  amountGbp?: string;
  method: string;
  provider: 'paystack' | 'direct_bank_transfer' | 'cash_teller';
  status: 'completed' | 'processing' | 'receipt_issued' | 'refunded';
  reference: string;
  invoiceNumber: string;
  breakdown: { item: string; fee: string }[];
}
