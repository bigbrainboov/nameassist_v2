/* SIRI.DEV */
import {
  type AdminApplication,
  type AdminCustomer,
  type AdminDocument,
  type AdminPayment,
  type TrackerStage
} from './types';

export const INITIAL_ADMIN_APPLICATIONS: AdminApplication[] = [
  {
    id: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    applicantEmail: 'ololade.adeleke@gmail.com',
    applicantPhone: '+234 803 219 4481',
    serviceId: 'change-of-name',
    serviceName: 'Change of Name (Post-Marital Transition)',
    category: 'Identity & Name',
    jurisdiction: 'High Court of Lagos State (Ikeja Judicial Division)',
    filingDate: '2026-08-28',
    estimatedCompletion: '2026-09-12',
    currentStageIndex: 3, // Stage 4: Newspaper & Official Gazette Publication
    status: 'gazette_published',
    priority: 'normal',
    assignedOfficer: 'Barr. Chinedu Obi (Senior Legal Registrar)',
    feeNgn: '₦45,000',
    paymentStatus: 'receipt_issued',
    officialRefNumber: 'HCJ/IKJ/DECL/2026/8841',
    gazetteNoticeRef: 'FGP/VOL-113/NO-44/P29',
    diasporaDestination: 'London, United Kingdom',
    internalNotes: [
      {
        id: 'note-1',
        author: 'Barr. Chinedu Obi',
        role: 'Senior Registrar',
        timestamp: '2026-08-30 14:45 WAT',
        text: 'Marriage certificate authenticated against Ikoyi Federal Marriage Registry records. Deed poll drafted and verified.'
      },
      {
        id: 'note-2',
        author: 'Adeola Shomolu',
        role: 'Gazette Officer',
        timestamp: '2026-09-05 09:15 WAT',
        text: 'Published in The Guardian newspaper (Vol 42, p.34). Gazette batch sent to Federal Printing Press Abuja.'
      }
    ],
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
  {
    id: 'NA-2026-9104-LDN',
    applicantName: 'Babajide F. Adeyemi',
    applicantEmail: 'baba.adeyemi@ukconsult.co.uk',
    applicantPhone: '+44 7911 829401',
    serviceId: 'name-correction',
    serviceName: 'Name Correction & WAEC/Degree Reconciliation',
    category: 'Education',
    jurisdiction: 'FCT High Court of Justice, Abuja',
    filingDate: '2026-08-22',
    estimatedCompletion: '2026-09-10',
    currentStageIndex: 4, // Stage 5: Inter-Agency Dossier Compilation
    status: 'dossier_compiled',
    priority: 'diaspora_express',
    assignedOfficer: 'Funke Balogun (Diaspora Legal Lead)',
    feeNgn: '₦48,000',
    paymentStatus: 'receipt_issued',
    officialRefNumber: 'FCT/HC/CV/2026/9104',
    diasporaDestination: 'Manchester, United Kingdom',
    internalNotes: [
      {
        id: 'note-3',
        author: 'Funke Balogun',
        role: 'Diaspora Desk',
        timestamp: '2026-08-23 11:20 WAT',
        text: 'WAEC official letter of confirmation received from Yaba Head Office. Affidavit of discrepancy approved by registrar.'
      },
      {
        id: 'note-4',
        author: 'Funke Balogun',
        role: 'Diaspora Desk',
        timestamp: '2026-09-06 16:30 WAT',
        text: 'MoFA consular legalisation completed. Preparing DHL expedited package for Manchester delivery.'
      }
    ],
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
        description: 'Statement of facts and affidavit of single persona harmonisation drafted by senior legal officer.',
        timestamp: '2026-08-25 15:10 WAT',
        stampCode: 'LEG-DRAFT-88',
        stampLocation: 'Legal Affairs Directorate, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Formally sworn and sealed at FCT High Court, Maitama Judicial Division.',
        timestamp: '2026-08-29 11:00 WAT',
        stampCode: 'FCT-HC-SEAL',
        stampLocation: 'FCT High Court Registry, Maitama',
        status: 'completed'
      },
      {
        stageNumber: 4,
        name: 'Ministry of Foreign Affairs Legalisation',
        description: 'Authentication by Consular and Legal Department, Ministry of Foreign Affairs, Abuja.',
        timestamp: '2026-09-04 14:00 WAT',
        stampCode: 'MFA-CONS-2026',
        stampLocation: 'MoFA Legalisation Directorate, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Compiling WAEC clearance cert, affidavit, and MoFA apostille for UK employer compliance.',
        timestamp: '2026-09-08 09:30 WAT',
        stampCode: 'DOS-COMP-09',
        stampLocation: 'NameAssist Central Fulfillment Desk',
        status: 'current'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Courier dispatch via DHL Express with direct tracking to applicant address in Manchester, UK.',
        status: 'pending'
      }
    ]
  },
  {
    id: 'NA-2026-7429-ABJ',
    applicantName: 'Alhaji Faruk Mohammed Bello',
    applicantEmail: 'faruk.bello@arewainvest.ng',
    applicantPhone: '+234 809 555 1204',
    serviceId: 'cac-harmonisation',
    serviceName: 'CAC Director Harmonisation Form 7A Status Report',
    category: 'Business & CAC',
    jurisdiction: 'High Court Registry, FCT Abuja & CAC Headquarters',
    filingDate: '2026-09-01',
    estimatedCompletion: '2026-09-14',
    currentStageIndex: 1, // Stage 2: Document Verification & Corporate Search
    status: 'legal_drafting',
    priority: 'urgent',
    assignedOfficer: 'Barr. Amina Al-Hassan (Corporate Counsel)',
    feeNgn: '₦52,000',
    paymentStatus: 'paid',
    officialRefNumber: 'CAC/CRP/2026/DIR-7429',
    internalNotes: [
      {
        id: 'note-5',
        author: 'Barr. Amina Al-Hassan',
        role: 'Corporate Counsel',
        timestamp: '2026-09-02 10:00 WAT',
        text: 'CAC CRP portal search confirmed RC 184920. Name formatting discrepancy between CAC Form 7 and current BVN identified.'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Company RC number and director identification documents cross-checked against CAC CRP database.',
        timestamp: '2026-09-01 11:30 WAT',
        stampCode: 'REC-CRP-11',
        stampLocation: 'NameAssist Corporate Services, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Statutory board resolution and CAC Form 7A affidavit of director identity synchronization being prepared.',
        timestamp: '2026-09-03 14:00 WAT',
        stampCode: 'CORP-REV-22',
        stampLocation: 'Corporate Registry Directorate, Abuja',
        status: 'current'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Declaration to be sworn before High Court Commissioner for Oaths.',
        status: 'pending'
      },
      {
        stageNumber: 4,
        name: 'CAC Portal Submission & Filing',
        description: 'Formal submission to Corporate Affairs Commission post-incorporation portal.',
        status: 'pending'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Retrieval of certified CAC Status Report and verification printout.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Handover of CAC certified true copy to corporate office in Abuja.',
        status: 'pending'
      }
    ]
  },
  {
    id: 'NA-2026-6218-TOR',
    applicantName: 'Dr. Chioma Nkemdilim Okonkwo',
    applicantEmail: 'chioma.okonkwo@healthontario.ca',
    applicantPhone: '+1 416 889 0231',
    serviceId: 'birth-documentation',
    serviceName: 'NPC Attestation of Birth & Statutory Age Declaration',
    category: 'Personal Documents',
    jurisdiction: 'National Population Commission (NPC) HQ & High Court Abuja',
    filingDate: '2026-08-15',
    estimatedCompletion: '2026-08-30',
    currentStageIndex: 5, // Stage 6: Dispatched & Delivered
    status: 'completed',
    priority: 'diaspora_express',
    assignedOfficer: 'Chijioke Eze (Registrar)',
    feeNgn: '₦35,000',
    paymentStatus: 'receipt_issued',
    officialRefNumber: 'NPC/ATT/2026/6218-TOR',
    diasporaDestination: 'Toronto, Canada',
    internalNotes: [
      {
        id: 'note-6',
        author: 'Chijioke Eze',
        role: 'Registrar',
        timestamp: '2026-08-20 16:00 WAT',
        text: 'NPC attestation issued with tamper-proof federal seal and digital QR verification for Canada IRCC.'
      },
      {
        id: 'note-7',
        author: 'Chijioke Eze',
        role: 'Registrar',
        timestamp: '2026-08-29 09:00 WAT',
        text: 'DHL tracking number 9948210492 confirmed delivered to applicant residence in North York, Toronto.'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Canadian immigration deadline confirmed. Birth records and parents’ state of origin validated.',
        timestamp: '2026-08-15 08:30 WAT',
        stampCode: 'REC-TOR-01',
        stampLocation: 'Diaspora Desk (North America)',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Drafting statutory declaration of age under Births and Deaths Act 1992.',
        timestamp: '2026-08-17 12:00 WAT',
        stampCode: 'LEG-NPC-44',
        stampLocation: 'Legal Affairs Directorate, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Age declaration affidavit sworn before High Court Commissioner for Oaths.',
        timestamp: '2026-08-19 10:30 WAT',
        stampCode: 'HCJ-ABJ-STAMP',
        stampLocation: 'FCT High Court Registry',
        status: 'completed'
      },
      {
        stageNumber: 4,
        name: 'NPC Attestation Processing',
        description: 'National Population Commission headquarters verification and official certificate generation.',
        timestamp: '2026-08-22 15:45 WAT',
        stampCode: 'NPC-HQ-SEAL',
        stampLocation: 'NPC Headquarters, Wuse Zone 7, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 5,
        name: 'Consular Legalisation (MoFA)',
        description: 'Ministry of Foreign Affairs authentication seal affixed for international compliance.',
        timestamp: '2026-08-26 11:20 WAT',
        stampCode: 'MOFA-LEG-2026',
        stampLocation: 'MoFA Legalisation Unit, Abuja',
        status: 'completed'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Dispatched via DHL Express to Toronto, Canada. Tracking: DHL-9948210492.',
        timestamp: '2026-08-29 09:00 WAT',
        stampCode: 'DHL-EXP-TRK',
        stampLocation: 'DHL International Hub, Lagos',
        status: 'completed'
      }
    ]
  },
  {
    id: 'NA-2026-5390-FRA',
    applicantName: 'Engr. Emeka Christian Nwachukwu',
    applicantEmail: 'emeka.c.nwachukwu@energy-eu.de',
    applicantPhone: '+49 176 4392 1084',
    serviceId: 'passport-support',
    serviceName: 'NIS Passport Support Dossier & Police Character Clearance',
    category: 'Passport & Travel',
    jurisdiction: 'CID Alagbon Close, Ikoyi & NIS Passport Office, Lagos',
    filingDate: '2026-09-04',
    estimatedCompletion: '2026-09-18',
    currentStageIndex: 0, // Stage 1: Intake Vetting & Action Required
    status: 'action_required',
    priority: 'urgent',
    assignedOfficer: 'Inspector Solomon G. (Liaison Officer)',
    feeNgn: '₦42,000',
    paymentStatus: 'paid',
    officialRefNumber: 'NIS/DOS/2026/5390-FRA',
    diasporaDestination: 'Frankfurt, Germany',
    internalNotes: [
      {
        id: 'note-8',
        author: 'Inspector Solomon G.',
        role: 'Liaison Officer',
        timestamp: '2026-09-06 14:15 WAT',
        text: 'Uploaded fingerprint scan resolution is below 300 DPI required by CID Alagbon forensic bureau. Re-upload request sent to applicant.'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Fingerprint card and passport biometric data page examined. Clarification needed on fingerprint clarity.',
        timestamp: '2026-09-04 10:00 WAT',
        stampCode: 'REC-NIS-02',
        stampLocation: 'Passport & Consular Desk, Lagos',
        status: 'current'
      },
      {
        stageNumber: 2,
        name: 'Forensic & Police Bureau Verification',
        description: 'CID Alagbon Central Criminal Registry fingerprint search and clearance certificate drafting.',
        status: 'pending'
      },
      {
        stageNumber: 3,
        name: 'Affidavit of Non-Criminal Record & Single Identity',
        description: 'Sworn before Commissioner for Oaths at High Court of Lagos State.',
        status: 'pending'
      },
      {
        stageNumber: 4,
        name: 'NIS Passport Support Recommendation Letter',
        description: 'Formal recommendation endorsement for Nigerian Embassy in Berlin.',
        status: 'pending'
      },
      {
        stageNumber: 5,
        name: 'MoFA Diplomatic Legalisation',
        description: 'Foreign Affairs authentication seal for German Ausländerbehörde immigration compliance.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Courier delivery to applicant in Frankfurt, Germany.',
        status: 'pending'
      }
    ]
  },
  {
    id: 'NA-2026-4182-PHC',
    applicantName: 'Ms. Grace Ibiso Briggs',
    applicantEmail: 'grace.briggs@oilserv-ng.com',
    applicantPhone: '+234 802 884 9012',
    serviceId: 'affidavit-declaration',
    serviceName: 'Statutory Declaration of Marital Status & Deed Poll',
    category: 'Personal Documents',
    jurisdiction: 'Rivers State High Court of Justice, Port Harcourt',
    filingDate: '2026-09-08',
    estimatedCompletion: '2026-09-17',
    currentStageIndex: 2, // Stage 3: Affidavit Sworn at High Court
    status: 'court_sworn',
    priority: 'normal',
    assignedOfficer: 'Barr. Tamuno George (Senior Registrar)',
    feeNgn: '₦22,000',
    paymentStatus: 'receipt_issued',
    officialRefNumber: 'RSHC/PHC/AFF/2026/4182',
    internalNotes: [
      {
        id: 'note-9',
        author: 'Barr. Tamuno George',
        role: 'Senior Registrar',
        timestamp: '2026-09-10 12:45 WAT',
        text: 'Affidavit completed and sworn at High Court Complex, Port Harcourt. Official court receipt issued.'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Case file opened. Identity documentation verified.',
        timestamp: '2026-09-08 09:30 WAT',
        stampCode: 'REC-PHC-01',
        stampLocation: 'Rivers State Intake Office',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Statutory declaration drafted in line with Evidence Act 2011.',
        timestamp: '2026-09-09 14:00 WAT',
        stampCode: 'LEG-PHC-12',
        stampLocation: 'Legal Drafting Directorate',
        status: 'completed'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'Sworn before Commissioner for Oaths, Rivers State High Court.',
        timestamp: '2026-09-10 11:30 WAT',
        stampCode: 'RSHC-SEAL-2026',
        stampLocation: 'High Court Registry, Port Harcourt',
        status: 'completed'
      },
      {
        stageNumber: 4,
        name: 'Newspaper Publication Notice',
        description: 'Publication in Vanguard national daily newspaper.',
        timestamp: '2026-09-12 08:00 WAT',
        stampCode: 'VAN-PUB-4182',
        stampLocation: 'Port Harcourt Bureau',
        status: 'current'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Assembling sealed court affidavit and full newspaper extract.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Dispatched to applicant office in Port Harcourt.',
        status: 'pending'
      }
    ]
  },
  {
    id: 'NA-2026-3091-KAN',
    applicantName: 'Mansur Abdullahi Danbatta',
    applicantEmail: 'mansur.danbatta@kda.gov.ng',
    applicantPhone: '+234 813 400 7821',
    serviceId: 'name-correction',
    serviceName: 'Affidavit of Discrepancy in Date of Birth & NIN Harmonization',
    category: 'Identity & Name',
    jurisdiction: 'Kano State High Court of Justice (Miller Road Division)',
    filingDate: '2026-09-11',
    estimatedCompletion: '2026-09-20',
    currentStageIndex: 1, // Stage 2: Drafting
    status: 'legal_drafting',
    priority: 'normal',
    assignedOfficer: 'Mallam Ibrahim Sani (Registrar)',
    feeNgn: '₦38,000',
    paymentStatus: 'paid',
    officialRefNumber: 'KSHC/MIL/2026/3091',
    internalNotes: [
      {
        id: 'note-10',
        author: 'Mallam Ibrahim Sani',
        role: 'Registrar',
        timestamp: '2026-09-12 11:00 WAT',
        text: 'NIN tracking slip and hospital birth certificate reviewed. Drafting affidavit of discrepancy for NIMC server synchronization.'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        name: 'Application Received & Intake Vetting',
        description: 'Vetted NIN registration slip and primary school testimonial.',
        timestamp: '2026-09-11 10:15 WAT',
        stampCode: 'REC-KAN-03',
        stampLocation: 'Kano Zonal Office',
        status: 'completed'
      },
      {
        stageNumber: 2,
        name: 'Document Verification & Legal Drafting',
        description: 'Drafting comprehensive declaration of single identity and chronological reconciliation.',
        timestamp: '2026-09-13 14:00 WAT',
        stampCode: 'LEG-KAN-29',
        stampLocation: 'Kano Legal Secretariat',
        status: 'current'
      },
      {
        stageNumber: 3,
        name: 'Affidavit Sworn at High Court',
        description: 'To be executed before Commissioner for Oaths at High Court Miller Road.',
        status: 'pending'
      },
      {
        stageNumber: 4,
        name: 'Newspaper Publication Notice',
        description: 'Daily Trust national newspaper disclaimer notice.',
        status: 'pending'
      },
      {
        stageNumber: 5,
        name: 'Inter-Agency Dossier Compilation',
        description: 'Preparation of NIMC Harmonisation docket.',
        status: 'pending'
      },
      {
        stageNumber: 6,
        name: 'Certified Documents Dispatched',
        description: 'Pick up at Kano Zonal Secretariat or courier dispatch.',
        status: 'pending'
      }
    ]
  }
];

export const INITIAL_ADMIN_CUSTOMERS: AdminCustomer[] = [
  {
    id: 'CUST-101',
    fullName: 'Mrs. Ololade Funmilayo Adeleke',
    email: 'ololade.adeleke@gmail.com',
    phone: '+234 803 219 4481',
    location: 'Lagos, Nigeria (UK Bound)',
    countryCode: 'NG',
    joinedDate: '28 Aug 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦45,000',
    status: 'verified',
    ninOrPassport: 'NIN: 9021-4820-1928',
    linkedCaseIds: ['NA-2026-8841-LAG']
  },
  {
    id: 'CUST-102',
    fullName: 'Babajide F. Adeyemi',
    email: 'baba.adeyemi@ukconsult.co.uk',
    phone: '+44 7911 829401',
    location: 'Manchester, United Kingdom',
    countryCode: 'GB',
    joinedDate: '22 Aug 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦48,000',
    status: 'verified',
    ninOrPassport: 'Passport: A08912401',
    linkedCaseIds: ['NA-2026-9104-LDN']
  },
  {
    id: 'CUST-103',
    fullName: 'Alhaji Faruk Mohammed Bello',
    email: 'faruk.bello@arewainvest.ng',
    phone: '+234 809 555 1204',
    location: 'Abuja, Nigeria',
    countryCode: 'NG',
    joinedDate: '01 Sep 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦52,000',
    status: 'verified',
    ninOrPassport: 'NIN: 4819-2091-8841',
    linkedCaseIds: ['NA-2026-7429-ABJ']
  },
  {
    id: 'CUST-104',
    fullName: 'Dr. Chioma Nkemdilim Okonkwo',
    email: 'chioma.okonkwo@healthontario.ca',
    phone: '+1 416 889 0231',
    location: 'Toronto, Canada',
    countryCode: 'CA',
    joinedDate: '15 Aug 2026',
    activeCasesCount: 0,
    totalSpentNgn: '₦35,000',
    status: 'verified',
    ninOrPassport: 'Passport: B19048201',
    linkedCaseIds: ['NA-2026-6218-TOR']
  },
  {
    id: 'CUST-105',
    fullName: 'Engr. Emeka Christian Nwachukwu',
    email: 'emeka.c.nwachukwu@energy-eu.de',
    phone: '+49 176 4392 1084',
    location: 'Frankfurt, Germany',
    countryCode: 'DE',
    joinedDate: '04 Sep 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦42,000',
    status: 'pending_verification',
    ninOrPassport: 'NIN: 7102-9931-4019',
    linkedCaseIds: ['NA-2026-5390-FRA']
  },
  {
    id: 'CUST-106',
    fullName: 'Ms. Grace Ibiso Briggs',
    email: 'grace.briggs@oilserv-ng.com',
    phone: '+234 802 884 9012',
    location: 'Port Harcourt, Nigeria',
    countryCode: 'NG',
    joinedDate: '08 Sep 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦22,000',
    status: 'verified',
    ninOrPassport: 'NIN: 5591-8204-1290',
    linkedCaseIds: ['NA-2026-4182-PHC']
  },
  {
    id: 'CUST-107',
    fullName: 'Mansur Abdullahi Danbatta',
    email: 'mansur.danbatta@kda.gov.ng',
    phone: '+234 813 400 7821',
    location: 'Kano, Nigeria',
    countryCode: 'NG',
    joinedDate: '11 Sep 2026',
    activeCasesCount: 1,
    totalSpentNgn: '₦38,000',
    status: 'verified',
    ninOrPassport: 'NIN: 6182-9014-7721',
    linkedCaseIds: ['NA-2026-3091-KAN']
  }
];

export const INITIAL_ADMIN_DOCUMENTS: AdminDocument[] = [
  {
    id: 'adoc-1',
    name: 'Applicant Valid Nigerian Passport Data Page',
    category: 'ID Proof',
    caseId: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    submittedDate: '28 Aug 2026',
    fileSize: '2.1 MB (PDF)',
    status: 'verified',
    sealAuthority: 'Nigeria Immigration Service (NIS)',
    sealNumber: 'NIS/BIO/VER-8841',
    isDeliverable: false,
    description: 'Scanned 300DPI biometric passport page showing maiden surname Olatunji.',
    reviewNotes: 'Verified clear MRZ strip and non-expired validity up to 2031.'
  },
  {
    id: 'adoc-2',
    name: 'Certified True Copy of Marriage Certificate (Ikoyi Registry)',
    category: 'Affidavit',
    caseId: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    submittedDate: '28 Aug 2026',
    fileSize: '3.4 MB (PDF)',
    status: 'verified',
    sealAuthority: 'Federal Marriage Registry, Ikoyi Lagos',
    sealNumber: 'FMR/IKY/VOL-82/901',
    isDeliverable: false,
    description: 'Official statutory marriage certificate between Adeleke & Olatunji.',
    reviewNotes: 'Authenticity confirmed via registry serial code.'
  },
  {
    id: 'adoc-3',
    name: 'High Court Sworn Affidavit of Change of Name (Official Seal)',
    category: 'Affidavit',
    caseId: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    submittedDate: '02 Sep 2026',
    fileSize: '1.9 MB (PDF)',
    status: 'ready',
    sealAuthority: 'High Court of Lagos State (Ikeja Judicial Division)',
    sealNumber: 'HCJ/IKJ/DECL/2026/8841',
    isDeliverable: true,
    description: 'Formal court declaration sworn before Commissioner for Oaths with judicial embossed revenue seal.',
    reviewNotes: 'Duly executed and uploaded for client download & archive.'
  },
  {
    id: 'adoc-4',
    name: 'Federal Republic of Nigeria Official Gazette Extract',
    category: 'Gazette Notice',
    caseId: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    submittedDate: '05 Sep 2026',
    fileSize: '4.1 MB (PDF)',
    status: 'ready',
    sealAuthority: 'The Federal Government Printer, Lagos & Abuja',
    sealNumber: 'FGP/VOL-113/NO-44/P29',
    isDeliverable: true,
    description: 'Certified extract of the official government publication notifying abandonment of old surname.',
    reviewNotes: 'Printed in Gazette Volume 113, page 29. Press seal authenticated.'
  },
  {
    id: 'adoc-5',
    name: 'WAEC Original Certificate & Discrepancy Statement',
    category: 'ID Proof',
    caseId: 'NA-2026-9104-LDN',
    applicantName: 'Babajide F. Adeyemi',
    submittedDate: '22 Aug 2026',
    fileSize: '2.8 MB (PDF)',
    status: 'verified',
    sealAuthority: 'West African Examinations Council (WAEC), Yaba',
    sealNumber: 'WAEC/CONF/2026/09104',
    isDeliverable: false,
    description: 'Applicant secondary school certificate showing omission of middle name Fashola.'
  },
  {
    id: 'adoc-6',
    name: 'Consular Legalisation Certificate (MoFA Apostille)',
    category: 'MoFA Legalisation',
    caseId: 'NA-2026-9104-LDN',
    applicantName: 'Babajide F. Adeyemi',
    submittedDate: '04 Sep 2026',
    fileSize: '2.4 MB (PDF)',
    status: 'ready',
    sealAuthority: 'Ministry of Foreign Affairs (Legalisation Directorate, Abuja)',
    sealNumber: 'MOFA/LEG/2026/09104',
    isDeliverable: true,
    description: 'Official diplomatic endorsement and authentication for UK Home Office compliance.'
  },
  {
    id: 'adoc-7',
    name: 'National Population Commission (NPC) Attestation of Birth',
    category: 'NPC Certificate',
    caseId: 'NA-2026-6218-TOR',
    applicantName: 'Dr. Chioma Nkemdilim Okonkwo',
    submittedDate: '22 Aug 2026',
    fileSize: '1.6 MB (PDF)',
    status: 'verified',
    sealAuthority: 'National Population Commission Headquarters, Abuja',
    sealNumber: 'NPC/ATT/2026/6218-TOR',
    isDeliverable: true,
    description: 'Statutory federal attestation of birth issued under Births and Deaths Compulsory Registration Act.'
  },
  {
    id: 'adoc-8',
    name: 'Forensic Fingerprint Biometric Card (Pending Re-scan)',
    category: 'ID Proof',
    caseId: 'NA-2026-5390-FRA',
    applicantName: 'Engr. Emeka Christian Nwachukwu',
    submittedDate: '04 Sep 2026',
    fileSize: '1.2 MB (JPEG)',
    status: 'pending_review',
    sealAuthority: 'CID Alagbon Close Forensic Unit',
    sealNumber: 'PENDING-RESPEC',
    isDeliverable: false,
    description: 'Applicant uploaded low-res phone picture of ink fingerprint roll.',
    reviewNotes: 'Flagged for re-upload: must be flatbed scanned at minimum 300 DPI.'
  }
];

export const INITIAL_ADMIN_PAYMENTS: AdminPayment[] = [
  {
    id: 'PAY-NA-2026-8841',
    caseId: 'NA-2026-8841-LAG',
    applicantName: 'Mrs. Ololade Funmilayo Adeleke',
    service: 'Change of Name (Post-Marital Transition)',
    date: '28 Aug 2026, 09:32 WAT',
    amountNgn: '₦45,000',
    amountGbp: '£65',
    method: 'Paystack (Debit Card)',
    provider: 'paystack',
    status: 'receipt_issued',
    reference: 'pstk_live_9941a82f3c0',
    invoiceNumber: 'INV-2026-08841',
    breakdown: [
      { item: 'High Court Commissioner for Oaths Statutory Filing Fee', fee: '₦18,500' },
      { item: 'Federal Gazette & National Daily Publication', fee: '₦19,500' },
      { item: 'Certified Archival Extraction & Notary Seal', fee: '₦7,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-9104',
    caseId: 'NA-2026-9104-LDN',
    applicantName: 'Babajide F. Adeyemi',
    service: 'Name Correction & WAEC/Degree Reconciliation',
    date: '22 Aug 2026, 10:45 WAT',
    amountNgn: '₦48,000',
    amountGbp: '£70',
    method: 'Paystack (International Visa Card)',
    provider: 'paystack',
    status: 'receipt_issued',
    reference: 'pstk_live_38210bf991a',
    invoiceNumber: 'INV-2026-09104',
    breakdown: [
      { item: 'High Court Oath & Judicial Seal', fee: '₦18,000' },
      { item: 'Ministry of Foreign Affairs Consular Legalisation', fee: '₦22,000' },
      { item: 'Expedited Processing & Courier Handling', fee: '₦8,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-7429',
    caseId: 'NA-2026-7429-ABJ',
    applicantName: 'Alhaji Faruk Mohammed Bello',
    service: 'CAC Director Harmonisation Form 7A Status Report',
    date: '01 Sep 2026, 11:40 WAT',
    amountNgn: '₦52,000',
    method: 'Zenith Bank Direct Electronic Transfer',
    provider: 'direct_bank_transfer',
    status: 'completed',
    reference: 'trf_zenith_88410291',
    invoiceNumber: 'INV-2026-07429',
    breakdown: [
      { item: 'CAC Statutory Corporate Filing & Stamp Duty', fee: '₦28,000' },
      { item: 'High Court Board Resolution Swearing Fee', fee: '₦14,000' },
      { item: 'Certified Corporate Affairs Status Report', fee: '₦10,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-6218',
    caseId: 'NA-2026-6218-TOR',
    applicantName: 'Dr. Chioma Nkemdilim Okonkwo',
    service: 'NPC Attestation of Birth & Statutory Age Declaration',
    date: '15 Aug 2026, 08:50 WAT',
    amountNgn: '₦35,000',
    amountGbp: '£50',
    method: 'Paystack (Mastercard)',
    provider: 'paystack',
    status: 'receipt_issued',
    reference: 'pstk_live_55102931a',
    invoiceNumber: 'INV-2026-06218',
    breakdown: [
      { item: 'NPC Federal Head Office Official Attestation Fee', fee: '₦18,000' },
      { item: 'High Court Statutory Declaration of Age', fee: '₦12,000' },
      { item: 'Digital Archive & QR Code Generation', fee: '₦5,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-5390',
    caseId: 'NA-2026-5390-FRA',
    applicantName: 'Engr. Emeka Christian Nwachukwu',
    service: 'NIS Passport Support Dossier & Police Character Clearance',
    date: '04 Sep 2026, 10:20 WAT',
    amountNgn: '₦42,000',
    amountGbp: '£60',
    method: 'Paystack (Euro Debit Card)',
    provider: 'paystack',
    status: 'completed',
    reference: 'pstk_live_44910281b',
    invoiceNumber: 'INV-2026-05390',
    breakdown: [
      { item: 'CID Alagbon Forensic Fingerprint Search Fee', fee: '₦20,000' },
      { item: 'NIS Headquarters Passport Clearance Dossier', fee: '₦15,000' },
      { item: 'Administrative Handling Fee', fee: '₦7,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-4182',
    caseId: 'NA-2026-4182-PHC',
    applicantName: 'Ms. Grace Ibiso Briggs',
    service: 'Statutory Declaration of Marital Status & Deed Poll',
    date: '08 Sep 2026, 09:40 WAT',
    amountNgn: '₦22,000',
    method: 'GTBank Direct Transfer / Court Teller',
    provider: 'cash_teller',
    status: 'receipt_issued',
    reference: 'gtb_pos_991823',
    invoiceNumber: 'INV-2026-04182',
    breakdown: [
      { item: 'Rivers State High Court Commissioner for Oaths Fee', fee: '₦15,000' },
      { item: 'Stamp Duty & Notarial Authentication', fee: '₦7,000' }
    ]
  },
  {
    id: 'PAY-NA-2026-3091',
    caseId: 'NA-2026-3091-KAN',
    applicantName: 'Mansur Abdullahi Danbatta',
    service: 'Affidavit of Discrepancy in Date of Birth & NIN Harmonization',
    date: '11 Sep 2026, 10:30 WAT',
    amountNgn: '₦38,000',
    method: 'Paystack (Debit Card)',
    provider: 'paystack',
    status: 'completed',
    reference: 'pstk_live_77192031a',
    invoiceNumber: 'INV-2026-03091',
    breakdown: [
      { item: 'Kano High Court Affidavit Fee', fee: '₦16,000' },
      { item: 'Daily Trust Newspaper Publication', fee: '₦16,000' },
      { item: 'NIMC Portal Synchronization Dossier', fee: '₦6,000' }
    ]
  }
];

// LocalStorage Keys
const STORAGE_APPS_KEY = 'nameassist.admin.applications';
const STORAGE_CUSTOMERS_KEY = 'nameassist.admin.customers';
const STORAGE_DOCS_KEY = 'nameassist.admin.documents';
const STORAGE_PAYMENTS_KEY = 'nameassist.admin.payments';

export function getStoredApplications(): AdminApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback to initial */
  }
  return INITIAL_ADMIN_APPLICATIONS;
}

export function saveStoredApplications(apps: AdminApplication[]): void {
  try {
    localStorage.setItem(STORAGE_APPS_KEY, JSON.stringify(apps));
  } catch {
    /* ignore */
  }
}

export function getStoredCustomers(): AdminCustomer[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return INITIAL_ADMIN_CUSTOMERS;
}

export function saveStoredCustomers(customers: AdminCustomer[]): void {
  try {
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
  } catch {
    /* ignore */
  }
}

export function getStoredDocuments(): AdminDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return INITIAL_ADMIN_DOCUMENTS;
}

export function saveStoredDocuments(docs: AdminDocument[]): void {
  try {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch {
    /* ignore */
  }
}

export function getStoredPayments(): AdminPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return INITIAL_ADMIN_PAYMENTS;
}

export function saveStoredPayments(payments: AdminPayment[]): void {
  try {
    localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
  } catch {
    /* ignore */
  }
}
