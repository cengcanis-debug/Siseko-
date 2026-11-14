import { BusinessEntityWorkspace } from '../types';

export type DeadlineUrgency = 'critical' | 'upcoming' | 'scheduled';

export interface TaxDeadlineItem {
  id: string;
  taxType: 'VAT201' | 'IRP6' | 'EMP201' | 'EMP501' | 'ADR1' | 'APPROVAL' | 'AUTO_ASSESS';
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueDateFormatted: string;
  daysRemaining: number;
  urgency: DeadlineUrgency;
  statutoryRef: string;
  description: string;
  targetTab:
    | 'vat201_lodgement'
    | 'statutory_enhancements'
    | 'emp501_reconciliation'
    | 'ita34_decoder'
    | 'multi_entity_access'
    | 'auto_assessment';
  entityId: string;
  entityCode: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatReadableDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function diffDays(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * Computes the last business day (Mon-Fri) of the specified month/year.
 * SARS requires electronic VAT201 returns & payment on the last business day of the month.
 */
export function getLastBusinessDayOfMonth(year: number, monthIndex: number): Date {
  const d = new Date(year, monthIndex + 1, 0);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * Computes the 7th of the month adjusted backwards to Friday if it falls on a weekend.
 * SARS requires EMP201 PAYE/UIF/SDL declarations & payment by the 7th (or preceding business day).
 */
export function getEmp201DueDate(year: number, monthIndex: number): Date {
  const d = new Date(year, monthIndex, 7);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function getFinancialYearEndMonthIndex(financialYearEnd: string): number {
  const lower = financialYearEnd.toLowerCase();
  if (lower.includes('jun')) return 5;
  if (lower.includes('dec')) return 11;
  if (lower.includes('mar')) return 2;
  if (lower.includes('sep')) return 8;
  return 1; // Default February (SA standard)
}

function classifyUrgency(daysRemaining: number): DeadlineUrgency {
  if (daysRemaining <= 16) return 'critical';
  if (daysRemaining <= 45) return 'upcoming';
  return 'scheduled';
}

export function getUpcomingTaxDeadlines(
  entity: BusinessEntityWorkspace,
  pendingApprovalsCount: number = 0,
  referenceDate: Date = new Date()
): TaxDeadlineItem[] {
  const items: TaxDeadlineItem[] = [];
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const y = today.getFullYear();
  const m = today.getMonth();

  // 1. VAT201 Return & Payment (only if entity is VAT registered)
  if (entity.profile.vatRegistered) {
    let vatDue = getLastBusinessDayOfMonth(y, m);
    if (vatDue.getTime() < today.getTime()) {
      const nextMonth = m === 11 ? 0 : m + 1;
      const nextYear = m === 11 ? y + 1 : y;
      vatDue = getLastBusinessDayOfMonth(nextYear, nextMonth);
    }
    const days = diffDays(today, vatDue);
    const periodMonthIndex = vatDue.getMonth() === 0 ? 11 : vatDue.getMonth() - 1;
    items.push({
      id: `${entity.id}-vat201-${toIsoDate(vatDue)}`,
      taxType: 'VAT201',
      title: `VAT201 eFiling Return (${MONTH_NAMES[periodMonthIndex]} Period)`,
      dueDate: toIsoDate(vatDue),
      dueDateFormatted: formatReadableDate(vatDue),
      daysRemaining: days,
      urgency: classifyUrgency(days),
      statutoryRef: 'VAT Act §28(1) • Last Business Day',
      description: `Electronic VAT201 submission & 15% net settlement for ${entity.profile.name}.`,
      targetTab: 'vat201_lodgement',
      entityId: entity.id,
      entityCode: entity.code
    });
  }

  // 2. Monthly EMP201 PAYE / UIF / SDL Declaration (7th of following month)
  let emp201Due = getEmp201DueDate(y, m);
  if (emp201Due.getTime() < today.getTime()) {
    const nextMonth = m === 11 ? 0 : m + 1;
    const nextYear = m === 11 ? y + 1 : y;
    emp201Due = getEmp201DueDate(nextYear, nextMonth);
  }
  const empDays = diffDays(today, emp201Due);
  const empPeriodMonth = emp201Due.getMonth() === 0 ? 11 : emp201Due.getMonth() - 1;
  items.push({
    id: `${entity.id}-emp201-${toIsoDate(emp201Due)}`,
    taxType: 'EMP201',
    title: `EMP201 Monthly PAYE / UIF / SDL (${MONTH_NAMES[empPeriodMonth]})`,
    dueDate: toIsoDate(emp201Due),
    dueDateFormatted: formatReadableDate(emp201Due),
    daysRemaining: empDays,
    urgency: classifyUrgency(empDays),
    statutoryRef: '4th Schedule Para 2(1) • 7th of Month',
    description: `Monthly payroll withholding declaration & ETI offset reconciliation.`,
    targetTab: 'emp501_reconciliation',
    entityId: entity.id,
    entityCode: entity.code
  });

  // 3. Provisional Tax (IRP6 — 1st and 2nd Periods based on entity Financial Year End)
  const fyeMonth = getFinancialYearEndMonthIndex(entity.financialYearEnd);
  const irp6FirstMonth = (fyeMonth + 6) % 12; // 6 months into tax year (e.g. Aug for Feb FYE, Dec for Jun FYE)
  const irp6SecondMonth = fyeMonth; // End of tax year

  const candidateIrp6Dates: Array<{ label: string; date: Date }> = [];
  for (const offsetYear of [y, y + 1]) {
    candidateIrp6Dates.push({
      label: 'IRP6 1st Provisional Return',
      date: new Date(offsetYear, irp6FirstMonth + 1, 0)
    });
    candidateIrp6Dates.push({
      label: 'IRP6 2nd Provisional Return',
      date: new Date(offsetYear, irp6SecondMonth + 1, 0)
    });
  }
  const nextIrp6 = candidateIrp6Dates
    .filter(c => c.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  if (nextIrp6) {
    const irpDays = diffDays(today, nextIrp6.date);
    items.push({
      id: `${entity.id}-irp6-${toIsoDate(nextIrp6.date)}`,
      taxType: 'IRP6',
      title: `${nextIrp6.label} (${entity.code})`,
      dueDate: toIsoDate(nextIrp6.date),
      dueDateFormatted: formatReadableDate(nextIrp6.date),
      daysRemaining: irpDays,
      urgency: classifyUrgency(irpDays),
      statutoryRef: '4th Schedule Para 19/21 • IRP6',
      description: `Provisional taxable income estimate & 6-month settlement (${entity.financialYearEnd} FYE).`,
      targetTab: 'statutory_enhancements',
      entityId: entity.id,
      entityCode: entity.code
    });
  }

  // 4. EMP501 Bi-Annual Employer Reconciliation (May 31 Annual / Oct 31 Interim)
  const emp501Candidates = [
    { label: 'EMP501 Annual Reconciliation (IRP5/IT3a)', date: new Date(y, 4, 31) },
    { label: 'EMP501 Interim Reconciliation (202608)', date: new Date(y, 9, 31) },
    { label: 'EMP501 Annual Reconciliation (IRP5/IT3a)', date: new Date(y + 1, 4, 31) },
    { label: 'EMP501 Interim Reconciliation (202708)', date: new Date(y + 1, 9, 31) }
  ];
  const nextEmp501 = emp501Candidates
    .filter(c => c.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  if (nextEmp501) {
    const reconDays = diffDays(today, nextEmp501.date);
    items.push({
      id: `${entity.id}-emp501-${toIsoDate(nextEmp501.date)}`,
      taxType: 'EMP501',
      title: nextEmp501.label,
      dueDate: toIsoDate(nextEmp501.date),
      dueDateFormatted: formatReadableDate(nextEmp501.date),
      daysRemaining: reconDays,
      urgency: classifyUrgency(reconDays),
      statutoryRef: 'TAA §25 & BRS • e@syFile Recon',
      description: 'Reconcile EMP201 monthly declarations against issued IRP5 certificates.',
      targetTab: 'emp501_reconciliation',
      entityId: entity.id,
      entityCode: entity.code
    });
  }

  // 5. Pending Submission Approvals Queue (if any awaiting sign-off)
  if (pendingApprovalsCount > 0) {
    items.push({
      id: `${entity.id}-approvals-pending`,
      taxType: 'APPROVAL',
      title: `${pendingApprovalsCount} Filing${pendingApprovalsCount > 1 ? 's' : ''} Awaiting Sign-Off`,
      dueDate: toIsoDate(today),
      dueDateFormatted: 'Action Required',
      daysRemaining: 0,
      urgency: 'critical',
      statutoryRef: 'RBAC Approval Gate',
      description: `Pending tax returns or objections queued for Owner / Accountant review.`,
      targetTab: 'multi_entity_access',
      entityId: entity.id,
      entityCode: entity.code
    });
  }

  // 6. Active TAA Rule 7 ADR1 Objection Window
  const adr1Date = new Date(today.getTime() + 54 * 24 * 60 * 60 * 1000);
  items.push({
    id: `${entity.id}-adr1-rule7`,
    taxType: 'ADR1',
    title: 'ITA34 Source Code 4015 Objection (Rule 7)',
    dueDate: toIsoDate(adr1Date),
    dueDateFormatted: formatReadableDate(adr1Date),
    daysRemaining: 54,
    urgency: 'scheduled',
    statutoryRef: 'TAA Rule 7 • 80-Business-Day Window',
    description: '54 business days remaining to file ADR1 Notice of Objection with logbook evidence.',
    targetTab: 'ita34_decoder',
    entityId: entity.id,
    entityCode: entity.code
  });

  return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
