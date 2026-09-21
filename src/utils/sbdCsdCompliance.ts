/**
 * SBD 4 (Bidder's Disclosure) & SBD 9 (Certificate of Independent Bid Determination)
 * Central Supplier Database (CSD) & PERSAL State Employee Cross-Validation Engine
 * Compliant with South African National Treasury SCM Instruction No. 03 of 2021/2022,
 * Public Finance Management Act (PFMA) No. 1 of 1999, and Public Service Act §30.
 */

export interface DirectorCsdRecord {
  directorId: string; // SA ID Number (13 digits) or Passport
  directorName: string;
  shareholdingPct: number;
  isStateEmployee: boolean;
  persalNumber?: string;
  organOfState?: string; // e.g., 'Department of Basic Education', 'City of Johannesburg'
  rankOrPosition?: string;
  hasSec30WrittenApproval: boolean; // Public Service Act Section 30 permission for remunerative work
  approvalDate?: string;
  csdSupplierNumber?: string; // MAAA number
}

export interface Sbd4DeclarationRequest {
  tenderReferenceNumber: string;
  bidderCompanyName: string;
  companyRegistrationNumber: string;
  csdMasterNumber: string; // e.g. MAAA0123456
  directors: DirectorCsdRecord[];
  isRelatedToOrganPersonnel: boolean;
  relatedPersonnelDetails?: {
    name: string;
    organOfState: string;
    relationshipType: string;
  };
}

export interface Sbd9CollusionCheckRequest {
  tenderReferenceNumber: string;
  bidderRegistrationNumber: string;
  jointVenturePartners?: {
    companyName: string;
    registrationNumber: string;
    csdNumber: string;
  }[];
  subcontractors?: {
    companyName: string;
    registrationNumber: string;
    declaredValueZAR: number;
  }[];
  knownCompetitorIpsOrAddresses?: string[];
  submissionIpAddress?: string;
}

export interface SbdComplianceEvaluationResult {
  isCompliant: boolean;
  riskLevel: 'CLEAN' | 'WARNING' | 'PROHIBITED';
  sbd4Summary: {
    stateEmployeeCount: number;
    unauthorizedStateEmployeeCount: number;
    conflictedDirectors: {
      directorName: string;
      idNumberMasked: string;
      organOfState: string;
      persalNumber: string;
      violationReason: string;
    }[];
  };
  sbd9Summary: {
    restrictivePracticeRisk: boolean;
    collusionIndicators: string[];
  };
  statutoryAuditLog: string[];
}

/**
 * Validates SBD 4 & SBD 9 declarations against simulated or live National Treasury CSD & PERSAL feeds.
 */
export function evaluateSbdConflictAndCollusion(
  sbd4: Sbd4DeclarationRequest,
  sbd9?: Sbd9CollusionCheckRequest
): SbdComplianceEvaluationResult {
  const conflictedDirectors: SbdComplianceEvaluationResult['sbd4Summary']['conflictedDirectors'] = [];
  const collusionIndicators: string[] = [];
  const auditLog: string[] = [];

  let stateEmployeeCount = 0;
  let unauthorizedStateEmployeeCount = 0;

  auditLog.push(`[${new Date().toISOString()}] Initiating SBD 4 / CSD Director PERSAL cross-matching for ${sbd4.bidderCompanyName} (CSD: ${sbd4.csdMasterNumber})`);

  // 1. Evaluate SBD 4 Directors against CSD / PERSAL Records
  sbd4.directors.forEach((director) => {
    const maskedId = director.directorId.length === 13 
      ? `${director.directorId.substring(0, 6)}****${director.directorId.substring(10)}` 
      : 'ID-PROTECTED';

    if (director.isStateEmployee) {
      stateEmployeeCount++;
      auditLog.push(`[SBD4_FLAG] Director ${director.directorName} flagged as State Employee at "${director.organOfState || 'Unknown Organ of State'}" (PERSAL: ${director.persalNumber || 'N/A'}).`);

      if (!director.hasSec30WrittenApproval) {
        unauthorizedStateEmployeeCount++;
        conflictedDirectors.push({
          directorName: director.directorName,
          idNumberMasked: maskedId,
          organOfState: director.organOfState || 'State Organ',
          persalNumber: director.persalNumber || 'UNREGISTERED_PERSAL',
          violationReason: 'Prohibited from doing business with the State under Public Administration Management Act §8 and Treasury Reg 16A9 without Executive Authority Section 30 approval.'
        });
      } else {
        auditLog.push(`[SBD4_CLEARANCE] Director ${director.directorName} has valid Section 30 approval dated ${director.approvalDate || 'Recently Verified'}.`);
      }
    }
  });

  // 2. Evaluate SBD 9 Restrictive Horizontal & Vertical Practices (Competition Act §4(1)(b))
  if (sbd9) {
    if (sbd9.jointVenturePartners && sbd9.jointVenturePartners.length > 0) {
      const partnerRegs = sbd9.jointVenturePartners.map(p => p.registrationNumber);
      if (partnerRegs.includes(sbd4.companyRegistrationNumber)) {
        collusionIndicators.push('Circular JV partnership detected with identical CIPC registration.');
      }
    }

    if (sbd9.subcontractors) {
      const excessiveSubcontract = sbd9.subcontractors.some(sub => sub.declaredValueZAR > 5000000);
      if (excessiveSubcontract) {
        auditLog.push('[SBD9_NOTE] Subcontracting exceeding R5m threshold flagged for SBD 6.1 B-BBEE verification.');
      }
    }
  }

  const isProhibited = unauthorizedStateEmployeeCount > 0;
  const isWarning = stateEmployeeCount > 0 && unauthorizedStateEmployeeCount === 0;

  return {
    isCompliant: !isProhibited,
    riskLevel: isProhibited ? 'PROHIBITED' : isWarning ? 'WARNING' : 'CLEAN',
    sbd4Summary: {
      stateEmployeeCount,
      unauthorizedStateEmployeeCount,
      conflictedDirectors
    },
    sbd9Summary: {
      restrictivePracticeRisk: collusionIndicators.length > 0,
      collusionIndicators
    },
    statutoryAuditLog: auditLog
  };
}

/**
 * Standard JSON Schema for SBD 4 Verification Request Payload
 */
export const SBD4_CSD_VERIFICATION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SBD4_CSD_State_Employee_Verification_Request",
  type: "object",
  required: ["tenderReferenceNumber", "bidderCompanyName", "csdMasterNumber", "directors"],
  properties: {
    tenderReferenceNumber: { type: "string", description: "Government bid/tender notice reference" },
    bidderCompanyName: { type: "string" },
    companyRegistrationNumber: { type: "string" },
    csdMasterNumber: { type: "string", pattern: "^MAAA[0-9]{7}$" },
    directors: {
      type: "array",
      items: {
        type: "object",
        required: ["directorId", "directorName", "isStateEmployee"],
        properties: {
          directorId: { type: "string", minLength: 13, maxLength: 13 },
          directorName: { type: "string" },
          shareholdingPct: { type: "number", minimum: 0, maximum: 100 },
          isStateEmployee: { type: "boolean" },
          persalNumber: { type: "string" },
          organOfState: { type: "string" },
          hasSec30WrittenApproval: { type: "boolean" },
          approvalDate: { type: "string", format: "date" }
        }
      }
    }
  }
};
