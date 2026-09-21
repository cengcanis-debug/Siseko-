export interface Ita34DisallowedItem {
  sourceCode: string;
  description: string;
  taxpayerClaimed: number;
  sarsAssessed: number;
  disallowedAmount: number;
  status: 'DISALLOWED' | 'REVISED' | 'ACCEPTED';
  primaryStatute: string;
  commonDisallowReasons: {
    code: string;
    title: string;
    description: string;
    statutoryRemedy: string;
  }[];
}

export interface LegalReference {
  statute: string;
  title: string;
  summary: string;
  keyPrinciples: string[];
  caseLaw: {
    citation: string;
    court: string;
    ratioDecidendi: string;
  }[];
}

export interface VaultEvidenceItem {
  id: string;
  filename: string;
  docType: 'TRAVEL_LOGBOOK' | 'PURCHASE_AGREEMENT' | 'MAINTENANCE_INVOICE' | 'FUEL_RECEIPTS';
  size: string;
  uploadedAt: string;
  sha256: string;
  verified: boolean;
}

export interface Rule7ObjectionPack {
  objectionRef: string;
  taxpayerName: string;
  taxpayerId: string;
  taxReferenceNo: string;
  assessmentNoticeNo: string;
  taxYear: string;
  sourceCode: string;
  disallowedAmount: number;
  businessKms: number;
  facts: string[];
  legalGrounds: string[];
  attachedEvidence: VaultEvidenceItem[];
  statutoryDeadlineDays: number;
  daysRemaining: number;
  draftedAt: string;
}
