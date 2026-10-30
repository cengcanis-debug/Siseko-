import {
  VdpApplicationDossier,
  VdpOversightCategory,
  UserTaxProfile,
  TaxTransaction
} from '../types';

/**
 * SARS Voluntary Disclosure Programme (VDP) Engine
 * Tax Administration Act No. 28 of 2011, Chapter 16, Part B (Sections 225 - 233)
 * Provides 100% relief from Understatement Penalties (TAA §222) and statutory relief
 * from criminal prosecution (TAA §229) when a taxpayer proactively discloses an oversight.
 */

export interface VdpPenaltyMitigationResult {
  taxShortfallZAR: number;
  standardPenaltyPercentage: number;
  standardPenaltyAmountZAR: number;
  vdpMitigatedPenaltyPercentage: number;
  vdpMitigatedPenaltyAmountZAR: number;
  penaltySavingsZAR: number;
  estimated89quatInterestZAR: number;
  totalWithoutVdpZAR: number;
  totalWithVdpZAR: number;
  netCashBenefitZAR: number;
  isCriminalImmunityApplicable: boolean;
  statutoryReliefSection: string;
}

/**
 * Computes the exact statutory penalty mitigation under TAA Section 229 Table.
 * Before audit notification (Column 3 of TAA §223 table):
 * - Substantial understatement: 10% -> 0%
 * - Reasonable care not taken: 25% -> 0%
 * - No reasonable grounds: 50% -> 0%
 * - Gross negligence: 50% -> 0%
 * - Intentional tax evasion: 100% -> 10%
 */
export function calculateVdpPenaltyMitigation(
  taxShortfallZAR: number,
  standardPenaltyPercentage: number = 50,
  annualInterestRate: number = 0.1175
): VdpPenaltyMitigationResult {
  const shortfall = Math.max(0, taxShortfallZAR);
  const standardPenaltyAmount = (shortfall * standardPenaltyPercentage) / 100;
  
  // Under TAA Section 229(a) Column 3 (Voluntary disclosure before audit notification):
  // Relief is 100% for categories 1-4 (standard penalty reduced to 0%)
  const vdpMitigatedPenaltyPercentage = standardPenaltyPercentage >= 100 ? 10 : 0;
  const vdpMitigatedPenaltyAmount = (shortfall * vdpMitigatedPenaltyPercentage) / 100;
  const penaltySavings = standardPenaltyAmount - vdpMitigatedPenaltyAmount;
  
  // Section 89quat interest (standard 6-month simulated period)
  const estimatedInterest = shortfall * annualInterestRate * 0.5;

  const totalWithoutVdp = shortfall + standardPenaltyAmount + estimatedInterest;
  const totalWithVdp = shortfall + vdpMitigatedPenaltyAmount + estimatedInterest;
  const netCashBenefit = totalWithoutVdp - totalWithVdp;

  return {
    taxShortfallZAR: shortfall,
    standardPenaltyPercentage,
    standardPenaltyAmountZAR: standardPenaltyAmount,
    vdpMitigatedPenaltyPercentage,
    vdpMitigatedPenaltyAmountZAR: vdpMitigatedPenaltyAmount,
    penaltySavingsZAR: penaltySavings,
    estimated89quatInterestZAR: estimatedInterest,
    totalWithoutVdpZAR: totalWithoutVdp,
    totalWithVdpZAR: totalWithVdp,
    netCashBenefitZAR: netCashBenefit,
    isCriminalImmunityApplicable: true,
    statutoryReliefSection: 'Tax Administration Act No. 28 of 2011, Section 229(a) & 229(b)'
  };
}

/**
 * Creates a formal VDP Application Dossier from a detected oversight or transaction.
 */
export function createVdpDossierFromOversight(
  profile: UserTaxProfile,
  title: string,
  description: string,
  category: VdpOversightCategory,
  shortfallZAR: number,
  standardPenaltyPct: number = 50,
  affectedTxIds: string[] = [],
  remediationPlan: string = 'Voluntarily repaying the uncollected tax shortfall plus statutory interest prior to any audit notice.'
): VdpApplicationDossier {
  const mitigation = calculateVdpPenaltyMitigation(shortfallZAR, standardPenaltyPct);
  const randomRef = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `VDP-${Date.now()}`,
    vdpRefNumber: `VDP-2026-${randomRef}`,
    taxpayerName: profile.name || 'Ilitha Fintech Operations (Pty) Ltd',
    taxReferenceNumber: profile.sarsTaxNumber || '9304318273',
    taxPeriod: '2025/2026 Tax Year',
    oversightTitle: title,
    oversightDescription: description,
    category,
    statutoryReference: 'TAA Chapter 16 Part B (Sections 225 - 233)',
    affectedTransactionIds: affectedTxIds,
    understatedTaxShortfallZAR: shortfallZAR,
    standardAuditPenaltyPercentage: standardPenaltyPct,
    standardAuditPenaltyAmountZAR: mitigation.standardPenaltyAmountZAR,
    mitigatedVdpPenaltyPercentage: mitigation.vdpMitigatedPenaltyPercentage,
    mitigatedVdpPenaltyAmountZAR: mitigation.vdpMitigatedPenaltyAmountZAR,
    penaltySavedZAR: mitigation.penaltySavingsZAR,
    estimated89quatInterestZAR: mitigation.estimated89quatInterestZAR,
    isCriminalImmunityGranted: true,
    eligibilityCriteria: {
      isVoluntaryNoPriorAuditNotice: true,
      hasMaterialDefault: true,
      isFullAndComplete: true,
      involvesShortfallPayment: true,
      doesNotYieldRefund: true
    },
    status: 'DRAFT',
    remediationPlan
  };
}

/**
 * Seed initial sample VDP disclosures demonstrating proactive penalty mitigation in action.
 */
export const INITIAL_VDP_DOSSIERS: VdpApplicationDossier[] = [
  {
    id: 'VDP-SAMPLE-001',
    vdpRefNumber: 'VDP-2026-894102',
    taxpayerName: 'Apex Strategic Advisory (Pty) Ltd',
    taxReferenceNumber: '9304318273',
    taxPeriod: '2025/2026 Tax Year',
    oversightTitle: 'Unapportioned Director Private Travel Claim (Source Code 4015)',
    oversightDescription: 'Internal reconciliation discovered that fuel and vehicle expenses of R48,500 were captured at 100% business deduction without corroborating Logbook #789 entries for weekend travel (2,400 km private usage).',
    category: 'DUAL_USE_UNAPPORTIONED',
    statutoryReference: 'Income Tax Act §8(1) & §23(g) / TAA §225',
    affectedTransactionIds: ['TX-TRAVEL-002'],
    understatedTaxShortfallZAR: 15035.00, // 48,500 * 31%
    standardAuditPenaltyPercentage: 50, // Gross Negligence under TAA §222
    standardAuditPenaltyAmountZAR: 7517.50,
    mitigatedVdpPenaltyPercentage: 0, // 100% relief under TAA §229(a)
    mitigatedVdpPenaltyAmountZAR: 0.00,
    penaltySavedZAR: 7517.50,
    estimated89quatInterestZAR: 883.31,
    isCriminalImmunityGranted: true,
    eligibilityCriteria: {
      isVoluntaryNoPriorAuditNotice: true,
      hasMaterialDefault: true,
      isFullAndComplete: true,
      involvesShortfallPayment: true,
      doesNotYieldRefund: true
    },
    status: 'SUBMITTED_TO_SARS',
    submittedAt: '2026-09-24',
    signedOffByRole: 'Accountant',
    remediationPlan: 'Reclassified R48,500 to personal director drawings, adjusted 2026 provisional tax payment, and remitted R15,035 shortfall plus interest to SARS.'
  },
  {
    id: 'VDP-SAMPLE-002',
    vdpRefNumber: 'VDP-2026-904218',
    taxpayerName: 'Apex Strategic Advisory (Pty) Ltd',
    taxReferenceNumber: '9304318273',
    taxPeriod: '2025/2026 Tax Year',
    oversightTitle: 'Omitted Consulting Invoice Output VAT (VAT Act Section 7(1)(a))',
    oversightDescription: 'A direct deposit of R65,000 for advisory services was inadvertently credited as exempt income instead of standard-rated supplies on the VAT201 return, leaving R8,478.26 in uncollected output VAT.',
    category: 'VAT_OUTPUT_UNDERPAYMENT',
    statutoryReference: 'VAT Act 89 of 1991 §7(1)(a) & TAA §226',
    affectedTransactionIds: ['TX-VAT-009'],
    understatedTaxShortfallZAR: 8478.26,
    standardAuditPenaltyPercentage: 25, // No Reasonable Grounds
    standardAuditPenaltyAmountZAR: 2119.57,
    mitigatedVdpPenaltyPercentage: 0,
    mitigatedVdpPenaltyAmountZAR: 0.00,
    penaltySavedZAR: 2119.57,
    estimated89quatInterestZAR: 498.10,
    isCriminalImmunityGranted: true,
    eligibilityCriteria: {
      isVoluntaryNoPriorAuditNotice: true,
      hasMaterialDefault: true,
      isFullAndComplete: true,
      involvesShortfallPayment: true,
      doesNotYieldRefund: true
    },
    status: 'VDP_AGREEMENT_SIGNED',
    submittedAt: '2026-09-15',
    signedOffByRole: 'Owner',
    remediationPlan: 'Issued amended Section 20 tax invoice to client, filed supplementary VDP disclosure on eFiling, and settled the output VAT shortfall.'
  }
];
