/* SIRI.DEV */
import { type ServiceItem, type ApplicationCase, type DashboardMetric, type RecentCaseRow } from './types';

export const SERVICES: ServiceItem[] = [
  {
    id: 'change-of-name',
    category: 'Identity & Name',
    title: 'Change of Name',
    shortDesc: 'Complete adult legal name transition including High Court affidavit, national daily publication, and Federal Gazette notice.',
    longDesc: 'The complete statutory process for changing your given name, surname, or both. Includes drafting the Deed Poll / Statutory Declaration, execution before a Commissioner for Oaths at the High Court of Justice, public notice in a certified national daily newspaper, and submission for Federal Republic of Nigeria Official Gazette gazetting.',
    turnaroundDays: '7–10 days',
    feeNgn: '₦45,000',
    feeGbp: '£65',
    statutoryBody: 'High Court of Justice & Federal Printing Press',
    requiredDocuments: ['Valid government ID (NIN slip, voter card, or passport)', 'Birth certificate or age declaration', 'Passport photograph'],
    keyOutcome: 'Certified High Court affidavit and national newspaper page publication extract.'
  },
  {
    id: 'name-correction',
    category: 'Identity & Name',
    title: 'Name Correction',
    shortDesc: 'Rectification of clerical misspellings, flipped middle names, or conflicting date/name records across official registries.',
    longDesc: 'Resolution of spelling discrepancies between your National Identity Number (NIN), Bank Verification Number (BVN), international passport, and educational certificates. We prepare specific affidavits of discrepancy, chronological reconciliation manifests, and facilitate NIMC database harmonization.',
    turnaroundDays: '5–8 days',
    feeNgn: '₦38,000',
    feeGbp: '£55',
    statutoryBody: 'High Court Registry & NIMC Harmonization Unit',
    requiredDocuments: ['NIN transaction slip', 'Conflicting identity document copies', 'Sworn statement of discrepancy origin'],
    keyOutcome: 'Harmonized affidavit of discrepancy acceptable to NIS, banks, and foreign immigration.'
  },
  {
    id: 'affidavit-declaration',
    category: 'Personal Documents',
    title: 'Affidavit / Statutory Declaration',
    shortDesc: 'Court-stamped affidavits for loss of documents, change of signature, age declaration, or single status verification.',
    longDesc: 'Statutory declarations sworn directly before a Commissioner for Oaths at accredited High Courts of Justice. Formats strictly adhere to the Evidence Act 2011 and are valid across all Nigerian commercial banks, foreign embassies, and civil registries.',
    turnaroundDays: '2–3 days',
    feeNgn: '₦22,000',
    feeGbp: '£35',
    statutoryBody: 'High Court of Justice Commissioner for Oaths',
    requiredDocuments: ['Means of identification', 'Factual summary of declaration', 'Supporting evidence (if loss of doc)'],
    keyOutcome: 'Duly sealed and signed statutory declaration with official court receipt.'
  },
  {
    id: 'newspaper-publication',
    category: 'Personal Documents',
    title: 'Newspaper Publication',
    shortDesc: 'Public disclaimer and change of name announcements published in accredited national daily newspapers.',
    longDesc: 'Mandatory public notification published in widely circulated national dailies (The Guardian, Vanguard, ThisDay, The Nation). Meets statutory requirements for Nigerian Immigration Service (NIS) passport renewals and Nigerian commercial banks. Includes full original hard-copy paper dispatch or certified e-clipping.',
    turnaroundDays: '2–4 days',
    feeNgn: '₦18,500',
    feeGbp: '£30',
    statutoryBody: 'Accredited National Dailies (Audit Bureau of Circulations)',
    requiredDocuments: ['Sworn High Court affidavit', 'Passport photograph', 'Clear text of announcement'],
    keyOutcome: 'Full page newspaper clipping with date header, volume, and page verification reference.'
  },
  {
    id: 'birth-documentation',
    category: 'Personal Documents',
    title: 'Birth Documentation',
    shortDesc: 'NPC birth certificates, statutory age declarations, and NPC attestation letters for diaspora visas.',
    longDesc: 'Processing of National Population Commission (NPC) birth registration for adults and minors, certified statutory age declarations for individuals born before 1992, and official NPC attestation letters routinely demanded by UK Home Office, US USCIS, and Canadian IRCC immigration officers.',
    turnaroundDays: '6–10 days',
    feeNgn: '₦35,000',
    feeGbp: '£50',
    statutoryBody: 'National Population Commission (NPC) & High Court Registry',
    requiredDocuments: ['Hospital birth record or baptismal certificate (if available)', 'Parents’ names and state of origin', 'Applicant photo'],
    keyOutcome: 'Digital NPC certificate with QR verification and sworn statutory declaration of age.'
  },
  {
    id: 'passport-support',
    category: 'Passport & Travel',
    title: 'Passport Support',
    shortDesc: 'Documentation packages required by Nigerian Immigration Service (NIS) for new names, renewals, and damaged passports.',
    longDesc: 'Preparation of the comprehensive regulatory dossier required by the Nigerian Immigration Service (NIS) to change the name on an e-Passport. We bundle the High Court affidavit, certified national daily publication, marriage certificate / divorce decree (if applicable), and generate the formal letter of request to the Comptroller General.',
    turnaroundDays: '4–7 days',
    feeNgn: '₦42,000',
    feeGbp: '£60',
    statutoryBody: 'Nigerian Immigration Service (NIS) Headquarters',
    requiredDocuments: ['Current standard passport data page', 'NIN confirmation slip in matching new name', 'Newspaper publication', 'Affidavit of name change'],
    keyOutcome: 'Complete NIS-compliant dossier ready for submission at passport offices in Nigeria or diaspora missions.'
  },
  {
    id: 'marriage-documentation',
    category: 'Family & Marriage',
    title: 'Marriage Documentation',
    shortDesc: 'Federal Marriage Registry certified true copies, marriage certificate gazetting, and surname adoption paperwork.',
    longDesc: 'End-to-end documentation for post-marital name adoption (taking husband’s surname, double-barrel surname, or reversion to maiden name). Includes procurement of Certified True Copies (CTC) from the Federal Marriage Registry (Ikoyi/Abuja) and court affidavit of marital change of name.',
    turnaroundDays: '5–8 days',
    feeNgn: '₦40,000',
    feeGbp: '£60',
    statutoryBody: 'Federal Ministry of Interior Marriage Registry & High Court',
    requiredDocuments: ['Marriage certificate copy', 'Husband’s consent letter (where applicable)', 'Identification of both spouses'],
    keyOutcome: 'Authenticated marriage documentation dossier and public legal publication.'
  },
  {
    id: 'academic-documentation',
    category: 'Education',
    title: 'Academic Documentation',
    shortDesc: 'Harmonizing secondary school (WAEC/NECO), JAMB, and university degree transcripts with your current legal name.',
    longDesc: 'Correction and reconciliation of names across educational certificates. While institutions do not re-issue original degree certificates with new names, we prepare the institution-specific Deed of Rectification, Registrar affirmation affidavits, and official institutional clearance packets recognized by Nigerian universities and foreign credential evaluators (WES, ECCTIS, IQAS).',
    turnaroundDays: '7–12 days',
    feeNgn: '₦48,000',
    feeGbp: '£70',
    statutoryBody: 'Academic Institutions, WAEC Legal Directorate, High Court',
    requiredDocuments: ['Copy of certificate with discrepancy', 'High Court affidavit of correction', 'Current national ID'],
    keyOutcome: 'Accredited credential reconciliation packet with official university registrar cover endorsement.'
  },
  {
    id: 'cac-services',
    category: 'Business & CAC',
    title: 'CAC Services',
    shortDesc: 'Updating director names, shareholding records, and company status with the Corporate Affairs Commission.',
    longDesc: 'Formal filing of Form CAC 7A / director and proprietor particulars update on the Corporate Affairs Commission (CAC) portal. Critical for entrepreneurs and company directors whose personal name change creates discrepancies on banking mandates, FIRS tax profiles, or public company registers.',
    turnaroundDays: '6–10 days',
    feeNgn: '₦55,000',
    feeGbp: '£80',
    statutoryBody: 'Corporate Affairs Commission (CAC)',
    requiredDocuments: ['Company RC/BN number', 'Updated NIN slip', 'Board resolution approving director name update', 'Newspaper publication & affidavit'],
    keyOutcome: 'Updated CAC Status Report / Extract showing current legal name of director/proprietor.'
  },
  {
    id: 'document-retrieval',
    category: 'Personal Documents',
    title: 'Document Retrieval',
    shortDesc: 'Retrieving historical school records, archived court judgments, lost certificates, and certified true copies in Nigeria.',
    longDesc: 'Physical document retrieval service across ministries, state archives, high court registries, and local government secretariats across all 36 Nigerian states and the FCT. Ideal for diaspora applicants unable to travel to Nigeria to extract certified archives.',
    turnaroundDays: '10–18 days',
    feeNgn: '₦65,000',
    feeGbp: '£95',
    statutoryBody: 'State High Courts, Archives, & Local Government Secretariats',
    requiredDocuments: ['Reference numbers or dates of original filing', 'Letter of authorization', 'Applicant ID'],
    keyOutcome: 'Certified True Copy (CTC) authenticated with original court registrar stamps.'
  },
  {
    id: 'bank-name-updates',
    category: 'Identity & Name',
    title: 'Bank & Institutional Name Updates',
    shortDesc: 'Structured paperwork and verification dossier for commercial banks, BVN harmonisation, and pension administrators.',
    longDesc: 'Resolution of frozen accounts, unlinked BVN records, and rejected remittances caused by surname changes or name arrangement order. We prepare the complete compliance dossier required by the Central Bank of Nigeria (CBN) and commercial bank risk desks.',
    turnaroundDays: '4–6 days',
    feeNgn: '₦32,000',
    feeGbp: '£48',
    statutoryBody: 'NIBSS (BVN Custodian) & Commercial Bank Compliance Desks',
    requiredDocuments: ['Bank account statement header', 'BVN printout', 'High Court affidavit of name change', 'Newspaper publication'],
    keyOutcome: 'Comprehensive bank presentation dossier and verified NIBSS update submission guidelines.'
  },
  {
    id: 'other-services',
    category: 'Personal Documents',
    title: 'Other Services',
    shortDesc: 'Custom legal documentation, Ministry of Foreign Affairs (MoFA) apostille, embassy consular attestation, and courier dispatch.',
    longDesc: 'Bespoke statutory documentation including Ministry of Foreign Affairs (MoFA) document legalisation, embassy consular stamping (e.g. UK, US, Germany, UAE), police character clearance certificate coordination, and DHL Express door-to-door courier dispatch across the world.',
    turnaroundDays: '5–14 days',
    feeNgn: '₦50,000',
    feeGbp: '£75',
    statutoryBody: 'Ministry of Foreign Affairs (MoFA) & Consular Missions',
    requiredDocuments: ['Original documents requiring attestation', 'Destination country requirements', 'Authorization proxy'],
    keyOutcome: 'Consular legalised documents sealed with red ribbon and MoFA revenue stamp.'
  }
];

export const TRACKER_CASES: Record<string, ApplicationCase> = {
  'NA-2026-8841-LAG': {
    id: 'NA-2026-8841-LAG',
    applicantName: 'Chidinma N. Okafor (née Eze)',
    serviceName: 'Change of Name (Post-Marital) & Passport Dossier',
    category: 'Family & Marriage',
    jurisdiction: 'Lagos State High Court (Ikeja Division)',
    filingDate: '2026-08-28',
    estimatedCompletion: '2026-09-12',
    currentStageIndex: 3, // 0-indexed: stage 4 (Gazette & Newspaper Publication)
    feeNgn: '₦45,000',
    diasporaDestination: 'London, United Kingdom',
    officialRefNumber: 'HCJ/IKJ/DECL/2026/8841',
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Case file opened. Identity documentation, marriage certificate, and passport data page inspected.',
        timestamp: '2026-08-28 09:14 WAT',
        stampCode: 'REC-LAG-01',
        stampLocation: 'NameAssist Central Intake Desk, Lagos',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Deed Poll and Statutory Declaration drafted according to High Court Civil Procedure rules.',
        timestamp: '2026-08-30 14:30 WAT',
        stampCode: 'LEG-VER-94',
        stampLocation: 'Legal Affairs Directorate, Lagos',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Declaration formally sworn before Commissioner for Oaths at High Court of Justice, Ikeja Division.',
        timestamp: '2026-09-02 11:45 WAT',
        stampCode: 'HCJ-IKJ-STAMP',
        stampLocation: 'Lagos State High Court Registry',
        status: 'completed'
      },
      {
        stageNumber: 4,
        name: 'Newspaper & Official Gazette Publication',
        description: 'Notice published in The Guardian (Vol. 42, No. 16,840, p. 34) and submitted to Federal Printing Press.',
        timestamp: '2026-09-05 08:00 WAT',
        stampCode: 'GAZ-PUB-2026',
        stampLocation: 'Audit Bureau of Circulations / Gazette Unit',
        status: 'current'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Harmonization package assembled for NIS Passport Renewal and NIMC National Identity database update.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Original court-sealed affidavit, newspaper clipping, and certified extract dispatched via DHL Express.',
        status: 'pending'
      }
    ]
  },
  'NA-2026-9104-LDN': {
    id: 'NA-2026-9104-LDN',
    applicantName: 'Babajide F. Adeyemi',
    serviceName: 'Name Correction & WAEC/Degree Reconciliation',
    category: 'Education',
    jurisdiction: 'FCT High Court of Justice, Abuja',
    filingDate: '2026-08-22',
    estimatedCompletion: '2026-09-08',
    currentStageIndex: 4, // stage 5
    feeNgn: '₦48,000',
    diasporaDestination: 'Manchester, United Kingdom',
    officialRefNumber: 'FCT/HC/CV/2026/9104',
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Application received from UK diaspora applicant. Discrepancy between degree transcript and passport analyzed.',
        timestamp: '2026-08-22 10:20 WAT',
        stampCode: 'REC-ABJ-04',
        stampLocation: 'Diaspora Desk (UK Liaison Unit)',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Affidavit of Discrepancy of Name and Confirmation of Identity drafted with chronological exhibits.',
        timestamp: '2026-08-24 16:15 WAT',
        stampCode: 'LEG-VER-88',
        stampLocation: 'Legal Affairs Directorate, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Statutory declaration sworn before Commissioner for Oaths at High Court of Justice, Maitama, Abuja.',
        timestamp: '2026-08-27 12:10 WAT',
        stampCode: 'FCT-MTM-STAMP',
        stampLocation: 'FCT High Court Maitama Registry',
        status: 'completed'
      },
      {
        stageNumber: 4,
        name: 'Newspaper & Official Gazette Publication',
        description: 'Notice published in Vanguard National Daily (Vol. 39, No. 12,044, p. 28). Certified clipping secured.',
        timestamp: '2026-08-31 09:00 WAT',
        stampCode: 'GAZ-PUB-2026',
        stampLocation: 'Vanguard Media National Office',
        status: 'completed'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Ministry of Foreign Affairs (MoFA) legalisation and consular certification underway for UK WES assessment.',
        timestamp: '2026-09-04 15:40 WAT',
        stampCode: 'MOFA-LGL-09',
        stampLocation: 'Ministry of Foreign Affairs, Abuja',
        status: 'current'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Secure international DHL courier tracking assignment and digital advance copy dispatch.',
        status: 'pending'
      }
    ]
  },
  'NA-2026-7429-ABJ': {
    id: 'NA-2026-7429-ABJ',
    applicantName: 'Dr. Amina K. Bello-Suleiman',
    serviceName: 'Corporate Affairs Commission (CAC) & Bank BVN Harmonisation',
    category: 'Business & CAC',
    jurisdiction: 'FCT High Court of Justice, Abuja',
    filingDate: '2026-09-01',
    estimatedCompletion: '2026-09-14',
    currentStageIndex: 2, // stage 3
    feeNgn: '₦55,000',
    diasporaDestination: 'Berlin, Germany',
    officialRefNumber: 'CAC/REG/DIR/2026/7429',
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Corporate records and CAC Status Report reviewed against updated Nigerian e-Passport.',
        timestamp: '2026-09-01 11:30 WAT',
        stampCode: 'REC-ABJ-07',
        stampLocation: 'Corporate Filings Desk, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Board resolution drafted alongside formal statutory declaration of director name change.',
        timestamp: '2026-09-03 14:00 WAT',
        stampCode: 'LEG-CAC-19',
        stampLocation: 'Corporate Practice Directorate',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Court appearance executed before High Court of Justice Commissioner for Oaths.',
        timestamp: '2026-09-06 10:15 WAT',
        stampCode: 'FCT-WUS-STAMP',
        stampLocation: 'FCT High Court Wuse Registry',
        status: 'current'
      },
      {
        stageNumber: 4,
        name: 'Newspaper & Official Gazette Publication',
        description: 'Scheduled for publication in ThisDay National Daily.',
        status: 'pending'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'CAC Form 7A electronic submission on Company Registration Portal (CRP).',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Dispatch of updated CAC Status Report and certified court documents.',
        status: 'pending'
      }
    ]
  }
};

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    label: 'Active Applications in Process',
    value: '142',
    subtext: 'Across 36 states & 28 diaspora countries',
    isMono: true
  },
  {
    label: 'High Court Affidavits Sworn',
    value: '2,548',
    subtext: '100% accredited Commissioner for Oaths execution',
    isMono: true
  },
  {
    label: 'Certified National Publications',
    value: '3,120',
    subtext: 'Archived daily newspapers & Federal Gazettes',
    isMono: true
  },
  {
    label: 'Average Document Turnaround',
    value: '6.4 days',
    subtext: 'From intake vetting to court seal completion',
    isMono: true
  }
];

export const RECENT_CASES: RecentCaseRow[] = [
  {
    id: 'NA-2026-8841-LAG',
    applicant: 'Chidinma N. Okafor',
    service: 'Change of Name (Post-Marital)',
    jurisdiction: 'Lagos High Court, Ikeja',
    statusText: 'Stage 4: Gazette Notice',
    statusVariant: 'processing',
    lastUpdated: '2026-09-05',
    amount: '₦45,000'
  },
  {
    id: 'NA-2026-9104-LDN',
    applicant: 'Babajide F. Adeyemi',
    service: 'Name Correction & WAEC Dossier',
    jurisdiction: 'FCT High Court, Maitama',
    statusText: 'Stage 5: MoFA Legalisation',
    statusVariant: 'court_stamped',
    lastUpdated: '2026-09-04',
    amount: '₦48,000'
  },
  {
    id: 'NA-2026-7429-ABJ',
    applicant: 'Dr. Amina K. Bello',
    service: 'CAC Director Harmonisation',
    jurisdiction: 'FCT High Court, Wuse',
    statusText: 'Stage 3: Court Sworn',
    statusVariant: 'processing',
    lastUpdated: '2026-09-06',
    amount: '₦55,000'
  },
  {
    id: 'NA-2026-6218-TOR',
    applicant: 'Emeka Victor Chukwu',
    service: 'Statutory Declaration of Age (NPC)',
    jurisdiction: 'Enugu State High Court',
    statusText: 'Dispatched to Canada',
    statusVariant: 'completed',
    lastUpdated: '2026-09-03',
    amount: '₦35,000'
  },
  {
    id: 'NA-2026-5390-FRA',
    applicant: 'Fatima Zainab Danjuma',
    service: 'Passport Support Dossier (NIS)',
    jurisdiction: 'Kano State High Court',
    statusText: 'Certified & Delivered',
    statusVariant: 'completed',
    lastUpdated: '2026-09-02',
    amount: '₦42,000'
  }
];

export const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Location & Jurisdiction',
    subtitle: 'Where are you and where are your documents held?',
    summary: 'Select Nigeria or your diaspora residence (UK, US, Canada, Germany, etc.). We determine the appropriate High Court jurisdiction and consular path.'
  },
  {
    step: 2,
    title: 'Service & Case Assessment',
    subtitle: 'Choose your paperwork scope',
    summary: 'Select a standard name change, spelling correction, post-marital transition, or bundled academic and passport documentation packages.'
  },
  {
    step: 3,
    title: 'Personal & Legal Particulars',
    subtitle: 'Provide current and intended name records',
    summary: 'State your current legal name, intended name, date of birth, state of origin, and factual grounds for the statutory declaration.'
  },
  {
    step: 4,
    title: 'Supporting Document Scans',
    subtitle: 'Secure digital intake of IDs and proofs',
    summary: 'Upload clear phone photos or scans of your NIN slip, birth certificate, old passport data page, marriage certificate, or certificate exhibits.'
  },
  {
    step: 5,
    title: 'Review, Escrow & Filing',
    subtitle: 'Transparent statutory fees with milestone protection',
    summary: 'Review your case brief, select payment in ₦ NGN, £ GBP, $ USD, or € EUR, and track your sworn court affidavit and newspaper publication in real time.'
  }
];
