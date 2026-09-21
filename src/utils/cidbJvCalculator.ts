/**
 * CIDB Joint Venture (JV) Grading Calculator
 * Compliant with Construction Industry Development Board (CIDB) Regulations (Regulation 25(1B)),
 * CIDB Best Practice Guideline A7, and Practice Note #20.
 * 
 * CIDB Class of Works:
 * - CE: Civil Engineering
 * - GB: General Building
 * - ME: Mechanical Engineering
 * - EE: Electrical Engineering (Infrastructure / Building)
 * - EP: Electrical Power
 * - SH: Specialist Hydraulic, etc.
 */

export type CidbClassOfWork = 'CE' | 'GB' | 'ME' | 'EE' | 'EP' | 'SH' | 'SQ' | 'SO';

export interface CidbGradeThreshold {
  grade: number;
  tenderValueLimitZAR: number;
  label: string;
}

export const CIDB_GRADE_THRESHOLDS: Record<number, number> = {
  1: 500000,       // R500,000 (R0.5m)
  2: 1000000,      // R1,000,000 (R1m)
  3: 3000000,      // R3,000,000 (R3m)
  4: 6000000,      // R6,000,000 (R6m)
  5: 10000000,     // R10,000,000 (R10m)
  6: 20000000,     // R20,000,000 (R20m)
  7: 60000000,     // R60,000,000 (R60m)
  8: 200000000,    // R200,000,000 (R200m)
  9: 999999999999, // Unlimited (>R200m)
};

export interface JvPartnerInput {
  contractorName: string;
  crsNumber: string; // CIDB Registration Number
  classOfWork: CidbClassOfWork;
  grade: number; // 1 through 9
  shareholdingPercentage: number; // e.g. 60%
}

export interface JvEvaluationResult {
  targetGrade: number;
  targetClassOfWork: CidbClassOfWork;
  qualifiesForTarget: boolean;
  effectiveCombinedGrade: number;
  effectiveTenderValueLimitZAR: number;
  leadPartner: JvPartnerInput;
  partners: JvPartnerInput[];
  methodApplied: 'Table 8 Combination Rule' | 'Financial Weighted Capability Rule';
  statutoryRuleSummary: string;
  equityValidationPassed: boolean;
  warnings: string[];
}

/**
 * Evaluates whether a Joint Venture combination of 2 or more contractors satisfies the target CIDB Grade
 * under Regulation 25(1B) (Table 8 Rules for Two-Firm or Three-Firm Joint Ventures).
 * 
 * Table 8 Rules for 2-Firm JVs:
 * - Target Grade 2: 1 × Grade 1 + 1 × Grade 1 (if sum capacity meets threshold)
 * - Target Grade 3: 1 × Grade 2 + 1 × Grade 2
 * - Target Grade 4: 1 × Grade 3 + 1 × Grade 3
 * - Target Grade 5: 1 × Grade 4 + 1 × Grade 4
 * - Target Grade 6: 1 × Grade 5 + 1 × Grade 4 (or 1 × Grade 5 + 2 × Grade 3)
 * - Target Grade 7: 1 × Grade 6 + 1 × Grade 5 (or 1 × Grade 6 + 2 × Grade 4)
 * - Target Grade 8: 1 × Grade 7 + 1 × Grade 6 (or 1 × Grade 7 + 2 × Grade 5)
 * - Target Grade 9: 1 × Grade 8 + 1 × Grade 8 (or 1 × Grade 8 + 2 × Grade 7)
 */
export function calculateCidbJvGrade(
  partners: JvPartnerInput[],
  targetGrade: number,
  targetClass: CidbClassOfWork
): JvEvaluationResult {
  const warnings: string[] = [];

  // Validate class of work match
  const mismatched = partners.filter(p => p.classOfWork !== targetClass);
  if (mismatched.length > 0) {
    warnings.push(`Warning: Partner ${mismatched.map(m => m.contractorName).join(', ')} is registered for ${mismatched.map(m => m.classOfWork).join(', ')}, differing from target ${targetClass}.`);
  }

  // Validate equity share total = 100%
  const totalEquity = partners.reduce((sum, p) => sum + p.shareholdingPercentage, 0);
  if (Math.abs(totalEquity - 100) > 0.5) {
    warnings.push(`Equity share total is ${totalEquity}%, must equal exactly 100%.`);
  }

  // Identify lead partner (highest equity or grade)
  const sortedPartners = [...partners].sort((a, b) => b.grade - a.grade || b.shareholdingPercentage - a.shareholdingPercentage);
  const lead = sortedPartners[0];

  // Lead partner minimum equity rule (CIDB mandates lead partner must hold at least 50% or appropriate governing share)
  const equityValidationPassed = lead.shareholdingPercentage >= 40; // minimum threshold for major partner
  if (!equityValidationPassed) {
    warnings.push(`Lead partner ${lead.contractorName} holds ${lead.shareholdingPercentage}%, below recommended 40%-50% governing operational threshold.`);
  }

  const partnerGrades = sortedPartners.map(p => p.grade);
  let effectiveGrade = lead.grade;
  let qualifies = false;
  let ruleText = '';

  // 2-Firm Evaluation Logic (Regulation 25(1B) Table 8)
  if (partners.length === 2) {
    const g1 = partnerGrades[0]; // Higher grade
    const g2 = partnerGrades[1]; // Lower or equal grade

    // 1 x Grade N + 1 x Grade N-1 qualifies for Grade N+1 (for Grade 5 and above)
    // E.g., Grade 5 + Grade 4 -> qualifies for Grade 6
    // E.g., Grade 6 + Grade 5 -> qualifies for Grade 7
    // E.g., Grade 7 + Grade 6 -> qualifies for Grade 8
    // E.g., Grade 8 + Grade 7 -> qualifies for Grade 9 (if 1x8 + 1x8 or 1x8 + 2x7)
    if (g1 === g2 && g1 < 9) {
      // 2 firms of same grade N can achieve Grade N+1 (for lower grades) or uplift
      effectiveGrade = g1 + 1;
      ruleText = `Table 8 Combination: Two Grade ${g1}${targetClass} contractors combined achieve Grade ${effectiveGrade}${targetClass}.`;
    } else if (g1 >= 4 && g2 >= (g1 - 1)) {
      // 1 x Grade (Target-1) + 1 x Grade (Target-2) -> achieves Target Grade
      effectiveGrade = g1 + 1;
      ruleText = `Table 8 Rule (1 × Grade ${g1} + 1 × Grade ${g2}): Combination successfully qualifies for Grade ${effectiveGrade}${targetClass}.`;
    } else {
      effectiveGrade = g1;
      ruleText = `Secondary partner Grade ${g2} is too low relative to lead partner Grade ${g1} to elevate beyond Grade ${effectiveGrade}.`;
    }
  } else if (partners.length >= 3) {
    // 3-Firm rule: 1 x (N) + 2 x (N-2) or 3 x (N)
    const g1 = partnerGrades[0];
    const g2 = partnerGrades[1];
    const g3 = partnerGrades[2];

    if (g1 >= 5 && g2 >= (g1 - 2) && g3 >= (g1 - 2)) {
      effectiveGrade = g1 + 1;
      ruleText = `Table 8 Three-Firm Rule (1 × Grade ${g1} + 2 × Grade ${g2}): Combination satisfies Grade ${effectiveGrade}${targetClass}.`;
    } else {
      effectiveGrade = g1;
      ruleText = `Three-firm joint venture retains effective Grade ${effectiveGrade}${targetClass}.`;
    }
  }

  qualifies = effectiveGrade >= targetGrade && warnings.length === 0;

  return {
    targetGrade,
    targetClassOfWork: targetClass,
    qualifiesForTarget: qualifies,
    effectiveCombinedGrade: effectiveGrade,
    effectiveTenderValueLimitZAR: CIDB_GRADE_THRESHOLDS[effectiveGrade] || 0,
    leadPartner: lead,
    partners,
    methodApplied: 'Table 8 Combination Rule',
    statutoryRuleSummary: ruleText,
    equityValidationPassed,
    warnings
  };
}
