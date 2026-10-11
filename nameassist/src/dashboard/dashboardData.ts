/* SIRI.DEV */
import { type UserDocumentItem, type PaymentRecord, type SupportTicket } from '../types';

export const MOCK_USER_DOCUMENTS: UserDocumentItem[] = [
  {
    id: 'doc-1',
    name: 'High Court Affidavit of Change of Name',
    category: 'Affidavit',
    caseId: 'NA-2026-8841-LAG',
    issueDate: '02 Sep 2026',
    fileSize: '1.8 MB (PDF)',
    status: 'verified',
    sealAuthority: 'High Court of Lagos State (Ikeja Judicial Division)',
    sealNumber: 'HCJ/IKJ/DECL/2026/8841',
    description: 'Statutory declaration of post-marital name transition sworn before Commissioner for Oaths with judicial embossed revenue seal.'
  },
  {
    id: 'doc-2',
    name: 'Federal Republic of Nigeria Official Gazette Notice',
    category: 'Gazette Notice',
    caseId: 'NA-2026-8841-LAG',
    issueDate: '05 Sep 2026',
    fileSize: '3.4 MB (PDF)',
    status: 'ready',
    sealAuthority: 'The Federal Government Printer, Lagos & Abuja',
    sealNumber: 'FGP/VOL-113/NO-44/P29',
    description: 'Certified extract of the official government publication notifying the public of abandonment of old surname and adoption of new married surname.'
  },
  {
    id: 'doc-3',
    name: 'Consular Legalisation Certificate (MoFA)',
    category: 'MoFA Legalisation',
    caseId: 'NA-2026-9104-LDN',
    issueDate: '04 Sep 2026',
    fileSize: '2.1 MB (PDF)',
    status: 'ready',
    sealAuthority: 'Ministry of Foreign Affairs (Legalisation Directorate, Abuja)',
    sealNumber: 'MOFA/LEG/2026/09104',
    description: 'Official diplomatic endorsement and authentication of degree certificate discrepancy for UK Home Office and employer compliance.'
  },
  {
    id: 'doc-4',
    name: 'National Population Commission (NPC) Attestation of Birth',
    category: 'NPC Certificate',
    caseId: 'NA-2026-6218-TOR',
    issueDate: '01 Sep 2026',
    fileSize: '1.4 MB (PDF)',
    status: 'verified',
    sealAuthority: 'National Population Commission Headquarters, Abuja',
    sealNumber: 'NPC/ATT/2026/6218-TOR',
    description: 'Statutory federal attestation of birth issued under Births and Deaths Compulsory Registration Act for Canada IRCC immigration.'
  },
  {
    id: 'doc-5',
    name: 'CAC Director Harmonisation Form 7A Status Report',
    category: 'CAC Filing',
    caseId: 'NA-2026-7429-ABJ',
    issueDate: '06 Sep 2026',
    fileSize: '2.6 MB (PDF)',
    status: 'processing',
    sealAuthority: 'Corporate Affairs Commission (CRP Unit, Abuja)',
    sealNumber: 'CAC/CRP/2026/DIR-7429',
    description: 'Formal corporate directors registry harmonization certifying director identity synchronization with current biometric e-passport.'
  },
  {
    id: 'doc-6',
    name: 'NIS Passport Support Dossier & Police Extract',
    category: 'ID Proof',
    caseId: 'NA-2026-5390-FRA',
    issueDate: '02 Sep 2026',
    fileSize: '4.2 MB (PDF)',
    status: 'verified',
    sealAuthority: 'Nigeria Immigration Service & CID Alagbon Close',
    sealNumber: 'NIS/DOS/2026/5390-FRA',
    description: 'Certified dossier package for passport renewal abroad and criminal record check clearance certification.'
  }
];

export const MOCK_PAYMENT_RECORDS: PaymentRecord[] = [
  {
    id: 'PAY-NA-2026-8841',
    caseId: 'NA-2026-8841-LAG',
    service: 'Change of Name (Post-Marital)',
    date: '28 Aug 2026, 09:32 WAT',
    amountNgn: '₦45,000',
    amountGbp: '£65',
    method: 'Paystack (Debit Card)',
    status: 'receipt_issued',
    reference: 'pstk_live_9941a82f3c0',
    breakdown: [
      { item: 'High Court Commissioner for Oaths Statutory Filing Fee', fee: '₦18,500' },
      { item: 'Federal Gazette & National Daily Publication', fee: '₦19,500' },
      { item: 'Certified Archival Extraction & Notary Seal', fee: '₦7,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-9104',
    caseId: 'NA-2026-9104-LDN',
    service: 'Name Correction & WAEC Dossier',
    date: '22 Aug 2026, 10:45 WAT',
    amountNgn: '₦48,000',
    amountGbp: '£70',
    method: 'International Card (UK)',
    status: 'receipt_issued',
    reference: 'pstk_live_4109b78e1d2',
    breakdown: [
      { item: 'FCT High Court Statutory Declaration of Discrepancy', fee: '₦18,000' },
      { item: 'WAEC Registry Document Reconciliation Manifest', fee: '₦15,000' },
      { item: 'Ministry of Foreign Affairs (MoFA) Consular Legalisation', fee: '₦15,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-7429',
    caseId: 'NA-2026-7429-ABJ',
    service: 'CAC Director Harmonisation',
    date: '01 Sep 2026, 12:10 WAT',
    amountNgn: '₦55,000',
    amountGbp: '£80',
    method: 'NIBSS Instant Transfer',
    status: 'completed',
    reference: 'nibss_tx_74291882910',
    breakdown: [
      { item: 'Corporate Board Resolution Drafting & High Court Execution', fee: '₦25,000' },
      { item: 'CAC Company Registration Portal (CRP) Form 7A Fee', fee: '₦20,000' },
      { item: 'Expedited Filing & Digital Compliance Seal', fee: '₦10,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-6218',
    caseId: 'NA-2026-6218-TOR',
    service: 'Statutory Declaration of Age (NPC)',
    date: '25 Aug 2026, 16:20 WAT',
    amountNgn: '₦35,000',
    amountGbp: '£50',
    method: 'Paystack (Mastercard)',
    status: 'receipt_issued',
    reference: 'pstk_live_6218c99f0a4',
    breakdown: [
      { item: 'NPC Federal Registry Age Attestation Certification', fee: '₦20,000' },
      { item: 'High Court Statutory Declaration of Age Filing', fee: '₦15,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-5390',
    caseId: 'NA-2026-5390-FRA',
    service: 'Passport Support Dossier (NIS)',
    date: '19 Aug 2026, 11:15 WAT',
    amountNgn: '₦42,000',
    amountGbp: '£60',
    method: 'Paystack (Visa)',
    status: 'completed',
    reference: 'pstk_live_5390d11a8b9',
    breakdown: [
      { item: 'NIS Passport Biometric Discrepancy Rectification Dossier', fee: '₦24,000' },
      { item: 'Court Stamp & Police CID Character Clearance', fee: '₦18,000' }
    ]
  }
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-8841',
    subject: 'Courier tracking for Federal Gazette physical clipping to London',
    caseId: 'NA-2026-8841-LAG',
    category: 'Diaspora Courier & Tracking',
    createdAt: '06 Sep 2026, 14:15 WAT',
    lastReply: '06 Sep 2026, 15:40 WAT',
    status: 'in_progress',
    priority: 'high',
    messages: [
      {
        sender: 'user',
        author: 'Chidinma Okafor',
        time: '14:15 WAT',
        text: 'Hello, my case has reached Stage 4 with the Gazette publication. Could you confirm if the physical paper clipping will be dispatched along with the certified affidavit to London?'
      },
      {
        sender: 'agent',
        author: 'NameAssist Diaspora Desk (Tolulope O.)',
        time: '15:40 WAT',
        text: 'Good day Mrs. Okafor. Yes, absolutely. Your dossier will include the original sworn High Court affidavit with the embossed seal, plus the full physical page clipping of The Guardian and the Federal Gazette extract. Once compiled, DHL Express tracking will be logged directly to your dashboard.'
      }
    ]
  },
  {
    id: 'TKT-9104',
    subject: 'MoFA Legalisation Apostille timing for UK NARIC / Ecctis',
    caseId: 'NA-2026-9104-LDN',
    category: 'Consular & Legalisation',
    createdAt: '03 Sep 2026, 09:20 WAT',
    lastReply: '03 Sep 2026, 11:05 WAT',
    status: 'resolved',
    priority: 'normal',
    messages: [
      {
        sender: 'user',
        author: 'Babajide Adeyemi',
        time: '09:20 WAT',
        text: 'Good morning. Does the MoFA certification carry the QR code verification required by UK Ecctis for educational comparability?'
      },
      {
        sender: 'agent',
        author: 'Barrister N. Kalu (Legal Affairs)',
        time: '11:05 WAT',
        text: 'Hello Babajide. Yes, our liaison team at MoFA Abuja secures the diplomatic revenue stamp with the official registrar signature and seal, fully accepted by UK Ecctis and the Home Office.'
      }
    ]
  }
];
