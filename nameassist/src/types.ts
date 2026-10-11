/* SIRI.DEV */
export type ServiceCategory =
  | 'Identity & Name'
  | 'Personal Documents'
  | 'Passport & Travel'
  | 'Family & Marriage'
  | 'Education'
  | 'Business & CAC';

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  title: string;
  shortDesc: string;
  longDesc: string;
  turnaroundDays: string;
  feeNgn: string;
  feeGbp: string;
  statutoryBody: string;
  requiredDocuments: string[];
  keyOutcome: string;
}

export interface TrackerStage {
  stageNumber: number;
  name: string;
  description: string;
  timestamp?: string;
  stampCode?: string;
  stampLocation?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ApplicationCase {
  id: string;
  applicantName: string;
  serviceName: string;
  category: ServiceCategory;
  jurisdiction: string;
  filingDate: string;
  estimatedCompletion: string;
  currentStageIndex: number;
  stages: TrackerStage[];
  feeNgn: string;
  diasporaDestination?: string;
  officialRefNumber: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  subtext: string;
  isMono?: boolean;
}

export interface RecentCaseRow {
  id: string;
  applicant: string;
  service: string;
  jurisdiction: string;
  statusText: string;
  statusVariant: 'completed' | 'processing' | 'court_stamped' | 'in_review';
  lastUpdated: string;
  amount: string;
}

export type DashboardTab = 'dashboard' | 'applications' | 'documents' | 'payments' | 'support' | 'profile';

export interface UserDocumentItem {
  id: string;
  name: string;
  category: 'Affidavit' | 'Gazette Notice' | 'NPC Certificate' | 'MoFA Legalisation' | 'CAC Filing' | 'ID Proof';
  caseId: string;
  issueDate: string;
  fileSize: string;
  status: 'verified' | 'ready' | 'processing';
  sealAuthority: string;
  sealNumber: string;
  downloadUrl?: string;
  description: string;
}

export interface PaymentRecord {
  id: string;
  caseId: string;
  service: string;
  date: string;
  amountNgn: string;
  amountGbp?: string;
  method: string;
  status: 'completed' | 'processing' | 'receipt_issued';
  reference: string;
  breakdown: { item: string; fee: string }[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  caseId?: string;
  category: string;
  createdAt: string;
  lastReply: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'normal' | 'high' | 'urgent';
  messages: { sender: 'user' | 'agent'; text: string; time: string; author: string }[];
}
