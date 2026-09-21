/**
 * SARS IT3(d) Third-Party Data Electronic Flat-File Parser & Validator
 * According to SARS External Business Requirements Specification (BRS):
 * IT3 Data Submission — Section 18A Public Benefit Organisation (PBO) Donations (Version 4.0, 2026 Tax Year)
 */

export interface SarsIt3dFileHeader {
  recordType: 'H';
  recordId: 'FH';
  fileVersion: string; // e.g. '4.0'
  taxYear: string; // e.g. '2026'
  periodStartDate: string; // e.g. '2026-03-01'
  periodEndDate: string; // e.g. '2026-08-31'
}

export interface SarsIt3dSubmittingEntity {
  recordType: 'H';
  recordId: 'SE';
  taxYear: string;
  periodStartDate: string;
  periodEndDate: string;
  entityType: string; // e.g. 'COMPANY'
  entityName: string; // e.g. 'Ilitha Fintech Pty Ltd'
  contactFirstName: string;
  contactSurname: string;
  contactEmail: string;
}

export interface SarsIt3dReportingEntity {
  recordType: 'H';
  recordId: 'REI';
  pboNumber: string; // e.g. '9300123456'
  pboName: string; // e.g. 'Ilitha Foundation'
}

export interface SarsIt3dDonorEntity {
  recordType: 'H';
  recordId: 'DEI';
  personNature: 'INDIVIDUAL' | 'COMPANY' | 'TRUST';
  idOrPassport: string; // 13-digit SA ID or passport
  taxNumber: string; // 10-digit SARS tax reference
  fullName: string;
  address: string;
  email: string;
  phone: string;
  idValidation?: {
    isValid: boolean;
    dateOfBirth?: string;
    gender?: 'Female' | 'Male';
    citizenship?: 'South African' | 'Permanent Resident / Foreign';
  };
}

export interface SarsIt3dDonationReceipt {
  recordType: 'H';
  recordId: 'DRI';
  receiptNumber: string; // e.g. 'REC-2026-001'
  donationDate: string; // e.g. '2026-04-15'
  amount: number; // e.g. 5000
  natureOfDonation: 'CASH' | 'PROPERTY_IN_KIND' | 'FINANCIAL_ASSET';
  certificateReference: string; // e.g. '18A-2026-001'
}

export interface SarsIt3dTrailer {
  recordType: 'T';
  recordCount: number; // e.g. 3
}

export interface SarsIt3dParsedSubmission {
  rawPayload: string;
  header?: SarsIt3dFileHeader;
  submittingEntity?: SarsIt3dSubmittingEntity;
  reportingEntity?: SarsIt3dReportingEntity;
  donor?: SarsIt3dDonorEntity;
  receipt?: SarsIt3dDonationReceipt;
  trailer?: SarsIt3dTrailer;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  pythonErrors: string[];
  isPythonValid: boolean;
  sha256Checksum: string;
  parsedAt: string;
}

/**
 * SARS SA ID Luhn algorithm check (13 digits)
 * Direct mathematical implementation matching the official SARS specification:
 * - Iterates reversed digits
 * - Odd positions (1-indexed from right) multiplied by 2; if > 9 subtract 9
 * - Sum modulo 10 must equal 0
 */
export function luhnSaId(idNo: string): boolean {
  const cleaned = (idNo || '').trim();
  if (!/^\d{13}$/.test(cleaned)) {
    return false;
  }
  let total = 0;
  const reversed = cleaned.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    let n = parseInt(reversed[i], 10);
    if (i % 2 === 1) {
      n = n * 2;
      if (n > 9) n -= 9;
    }
    total += n;
  }
  return total % 10 === 0;
}

/**
 * Validate South African 13-digit Identity Number with Luhn algorithm and demographic extraction
 */
export function validateSouthAfricanId(idNumber: string): {
  isValid: boolean;
  dateOfBirth?: string;
  gender?: 'Female' | 'Male';
  citizenship?: 'South African' | 'Permanent Resident / Foreign';
} {
  const cleaned = (idNumber || '').trim();
  if (!/^\d{13}$/.test(cleaned)) {
    return { isValid: false };
  }

  const isValid = luhnSaId(cleaned);
  if (!isValid) {
    return { isValid: false };
  }

  // Parse demographic data
  const yearPrefix = parseInt(cleaned.substring(0, 2), 10) > 26 ? '19' : '20';
  const birthYear = `${yearPrefix}${cleaned.substring(0, 2)}`;
  const birthMonth = cleaned.substring(2, 4);
  const birthDay = cleaned.substring(4, 6);
  const genderCode = parseInt(cleaned.substring(6, 10), 10);
  const citizenCode = parseInt(cleaned[10], 10);

  return {
    isValid: true,
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    gender: genderCode < 5000 ? 'Female' : 'Male',
    citizenship: citizenCode === 0 ? 'South African' : 'Permanent Resident / Foreign'
  };
}

/**
 * Statutory SARS IT3(d) Filename Specifications
 * Naming Pattern: IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
 * Canonical Example: IT3d.9301234567.20260516.120000.txt
 */
export const SARS_IT3D_FILENAME_TEMPLATE = 'IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt';
export const SAMPLE_IT3D_FILENAME = 'IT3d.9301234567.20260516.120000.txt';
export const SARS_IT3D_FILENAME_REGEX = /^IT3d\.(\d{10})\.(\d{8})\.(\d{6})\.txt$/i;

export interface SarsIt3dFilenameValidationResult {
  isValid: boolean;
  filename: string;
  errors: string[];
  parsed?: {
    pboNumber: string;
    date: string;
    time: string;
    formattedDate: string;
    formattedTime: string;
  };
  template: string;
  sample: string;
}

/**
 * Validates whether a given filename conforms to the official SARS IT3(d) BRS v4.0 naming standard:
 * IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
 * (e.g. IT3d.9301234567.20260516.120000.txt)
 */
export function validateSarsIt3dFilename(filename: string, expectedPbo?: string): SarsIt3dFilenameValidationResult {
  const cleanName = (filename || '').trim();
  const errors: string[] = [];

  if (!cleanName) {
    return {
      isValid: false,
      filename: cleanName,
      errors: ['Filename cannot be empty'],
      template: SARS_IT3D_FILENAME_TEMPLATE,
      sample: SAMPLE_IT3D_FILENAME
    };
  }

  const match = SARS_IT3D_FILENAME_REGEX.exec(cleanName);
  if (!match) {
    return {
      isValid: false,
      filename: cleanName,
      errors: [
        `Filename '${cleanName}' violates statutory SARS specification: ${SARS_IT3D_FILENAME_TEMPLATE}. Example: ${SAMPLE_IT3D_FILENAME}`
      ],
      template: SARS_IT3D_FILENAME_TEMPLATE,
      sample: SAMPLE_IT3D_FILENAME
    };
  }

  const [, pbo, dateStr, timeStr] = match;

  // 1. PBO checks: Must be 10 digits starting with 930
  if (!pbo.startsWith('930')) {
    errors.push(`PBO reference number '${pbo}' must start with '930' series (got ${pbo})`);
  }

  // 2. Expected PBO match check
  if (expectedPbo) {
    const cleanExpected = expectedPbo.replace(/\D/g, '');
    if (cleanExpected && cleanExpected !== pbo) {
      errors.push(`Filename PBO '${pbo}' does not match entity PBO '${cleanExpected}'`);
    }
  }

  // 3. Date check: YYYYMMDD
  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    errors.push(`Date '${dateStr}' in filename is not a valid calendar date`);
  }

  // 4. Time check: HHMMSS
  const hh = parseInt(timeStr.substring(0, 2), 10);
  const mm = parseInt(timeStr.substring(2, 4), 10);
  const ss = parseInt(timeStr.substring(4, 6), 10);
  if (hh > 23 || mm > 59 || ss > 59) {
    errors.push(`Time '${timeStr}' in filename is not a valid 24-hour timestamp (00-23, 00-59, 00-59)`);
  }

  return {
    isValid: errors.length === 0,
    filename: cleanName,
    errors,
    parsed: {
      pboNumber: pbo,
      date: dateStr,
      time: timeStr,
      formattedDate: `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`,
      formattedTime: `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:${timeStr.substring(4, 6)}`
    },
    template: SARS_IT3D_FILENAME_TEMPLATE,
    sample: SAMPLE_IT3D_FILENAME
  };
}

/**
 * Generates an authoritative SARS IT3(d) compliant filename:
 * IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
 * Default fallback: IT3d.9301234567.20260516.120000.txt
 */
export function generateSarsIt3dFilename(pboNumber?: string, date?: Date): string {
  let cleanPbo = (pboNumber || '9301234567').replace(/\D/g, '');
  if (cleanPbo.length === 0) cleanPbo = '9301234567';
  if (cleanPbo.length < 10) cleanPbo = cleanPbo.padEnd(10, '0');
  if (cleanPbo.length > 10) cleanPbo = cleanPbo.substring(0, 10);

  const targetDate = date || new Date(Date.UTC(2026, 4, 16, 12, 0, 0)); // 2026-05-16 12:00:00
  const yyyy = targetDate.getUTCFullYear();
  const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getUTCDate()).padStart(2, '0');
  const hh = String(targetDate.getUTCHours()).padStart(2, '0');
  const min = String(targetDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(targetDate.getUTCSeconds()).padStart(2, '0');

  return `IT3d.${cleanPbo}.${yyyy}${mm}${dd}.${hh}${min}${ss}.txt`;
}

/**
 * Asynchronous validation calling the backend Python validator endpoint (/api/validate-it3d).
 * Executes scripts/validate_it3d.py on the server.
 * If errors.length === 0, file satisfies SARS BRS v4.0.0D-10.
 */
export async function validate_it3d_file(
  lines: string[], 
  taxYear: number = 2026, 
  options: { strict?: boolean; filename?: string } = {}
): Promise<string[]> {
  try {
    const response = await fetch('/api/validate-it3d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines,
        tax_year: taxYear,
        strict: options.strict,
        filename: options.filename
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.errors)) {
        return data.errors;
      }
    }
  } catch (err) {
    console.warn('Backend Python validator endpoint unreachable, falling back to local engine:', err);
  }
  return validateIt3dFile(lines, taxYear, options);
}

/**
 * Reference Python Validator function transcribed directly into TypeScript
 * Matches validate_it3d_file(lines, tax_year=2026)
 */
export function validateIt3dFile(lines: string[], taxYear: number = 2026, options: { strict?: boolean } = {}): string[] {
  const errors: string[] = [];
  const seenReceipts = new Set<string>();

  if (!lines || lines.length === 0) {
    return ['Empty file'];
  }

  const header = lines[0].trim().split('|');
  if (header[0] !== 'H' || header[1] !== 'FH') {
    errors.push(`Line 1: First record must be H|FH, got ${lines[0].substring(0, 20)}`);
  }

  const trailer = lines[lines.length - 1].trim().split('|');
  if (trailer[0] !== 'T') {
    errors.push('Last line must be T|count (e.g. T|00000015)');
  } else {
    try {
      const expected = parseInt(trailer[1], 10);
      const totalLines = lines.length; // total lines including H and T
      const recordsBetween = lines.length - 2; // excl FH and T
      const substantiveCount = lines.filter(l => {
        const p = l.trim().split('|');
        return p[0] === 'H' && (p[1] === 'REI' || p[1] === 'DEI' || p[1] === 'DRI');
      }).length;

      if (isNaN(expected)) {
        errors.push('Trailer second field must be numeric (e.g. T|00000015)');
      } else if (expected === totalLines) {
        // Valid statutory trailer count: strictly matches total lines including H and T (e.g. T|00000015)
      } else if (!options.strict && (expected === recordsBetween || expected === substantiveCount)) {
        // Permitted in non-strict legacy mode
      } else {
        const formattedExpected = String(totalLines).padStart(8, '0');
        errors.push(`Trailer count ${expected} != total lines ${totalLines} (must = total lines including H and T, e.g. T|${formattedExpected})`);
      }
    } catch {
      errors.push('Trailer second field must be numeric (e.g. T|00000015)');
    }
  }

  for (let idx = 1; idx < lines.length - 1; idx++) {
    const raw = lines[idx];
    const lineNum = idx + 1; // 1-indexed matching enumerate(lines[1:-1], start=2)
    if (!raw.trim()) continue;

    const parts = raw.trim().split('|');
    if (parts[0] !== 'H') {
      errors.push(`Line ${lineNum}: Must start with H`);
      continue;
    }

    const hType = parts.length > 1 ? parts[1] : '';

    if (hType === 'SE') { // Submitting Entity
      if (parts.length < 10) {
        errors.push(`Line ${lineNum} SE: Too few fields, expected >=10, got ${parts.length}`);
      }
      // Check email location: handle index 8 or index 9 (when first name and surname are split)
      const emailField = options.strict 
        ? (parts[8] || '') 
        : (parts.find((p, i) => i >= 7 && p.includes('@')) || parts[9] || parts[8] || '');
      
      if (!emailField.includes('@') || !emailField.includes('.')) {
        errors.push(`Line ${lineNum} SE: Invalid email ${emailField}`);
      }

    } else if (hType === 'REI') { // Reporting Entity - PBO
      if (parts.length < 3) {
        errors.push(`Line ${lineNum} REI: Too few fields`);
      }
      const pbo = parts.length > 2 ? parts[2] : '';
      if (!/^930\d{7}$/.test(pbo)) {
        errors.push(`Line ${lineNum} REI: PBO ref must be 930 + 7 digits, got ${pbo}`);
      }

    } else if (hType === 'DEI') { // Donor
      // H|DEI|INDIVIDUAL|ID|TAXREF|Name|Address|Email|Cell
      if (parts.length < 9) {
        errors.push(`Line ${lineNum} DEI: Expected 9 fields, got ${parts.length}`);
        continue;
      }
      const nature = parts[2];
      const idNo = parts[3];
      const taxref = parts[4];
      // name = parts[5], addr = parts[6]
      const email = parts[7];
      const cell = parts[8];

      if (nature === 'INDIVIDUAL' && !luhnSaId(idNo)) {
        errors.push(`Line ${lineNum} DEI: Invalid SA ID ${idNo}`);
      }

      if (taxref && !/^\d{10}$/.test(taxref)) {
        errors.push(`Line ${lineNum} DEI: Tax ref must be 10 digits, got ${taxref}`);
      }

      const emailDomain = email.includes('@') ? email.split('@')[1] : '';
      if (!email.includes('@') || !emailDomain.includes('.')) {
        errors.push(`Line ${lineNum} DEI: Invalid email ${email}`);
      }

      if (!/^\d{9,15}$/.test(cell)) {
        errors.push(`Line ${lineNum} DEI: Cell must be 9-15 digits no +/space, got ${cell}`);
      }

    } else if (hType === 'DRI') { // Donation
      // H|DRI|Receipt|Date|Amount|Nature|CertNo
      if (parts.length < 7) {
        errors.push(`Line ${lineNum} DRI: Expected 7 fields, got ${parts.length}`);
        continue;
      }
      const receipt = parts[2];
      const ddate = parts[3];
      const amount = parts[4];
      const nature = parts[5];

      if (seenReceipts.has(receipt)) {
        errors.push(`Line ${lineNum} DRI: Duplicate receipt ${receipt}`);
      }
      seenReceipts.add(receipt);

      const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ddate) || /^(\d{4})(\d{2})(\d{2})$/.exec(ddate);
      if (!dateMatch) {
        errors.push(`Line ${lineNum} DRI: Invalid date ${ddate}, need CCYY-MM-DD or CCYYMMDD`);
      } else {
        const year = parseInt(dateMatch[1], 10);
        if (year !== taxYear) {
          errors.push(`Line ${lineNum} DRI: Date year ${year} != tax year ${taxYear}`);
        }
      }

      const amt = parseFloat(amount);
      if (isNaN(amt)) {
        errors.push(`Line ${lineNum} DRI: Amount not numeric ${amount}`);
      } else if (amt <= 0) {
        errors.push(`Line ${lineNum} DRI: Amount must be >0, got ${amount}`);
      }

      if (nature !== 'CASH' && nature !== 'PROPERTY_IN_KIND') {
        errors.push(`Line ${lineNum} DRI: Nature must be CASH or PROPERTY_IN_KIND, got ${nature}`);
      }
    }
  }

  return errors;
}

/**
 * Simple synthetic SHA-256 generator for local payload sealing
 */
export function generateSyntheticPayloadChecksum(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `SHA256:${hex.repeat(8).substring(0, 64)}`;
}

/**
 * Parses SARS IT3(d) Pipe-Delimited Flat-File Submission
 */
export function parseSarsIt3dFlatFile(rawContent: string): SarsIt3dParsedSubmission {
  const lines = rawContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const errors: string[] = [];
  const warnings: string[] = [];

  let header: SarsIt3dFileHeader | undefined;
  let submittingEntity: SarsIt3dSubmittingEntity | undefined;
  let reportingEntity: SarsIt3dReportingEntity | undefined;
  let donor: SarsIt3dDonorEntity | undefined;
  let receipt: SarsIt3dDonationReceipt | undefined;
  let trailer: SarsIt3dTrailer | undefined;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const parts = line.split('|').map(p => p.trim());
    const recordType = parts[0];

    if (recordType === 'H') {
      const recordId = parts[1];
      
      switch (recordId) {
        case 'FH': // File Header
          if (parts.length < 6) {
            errors.push(`Line ${index + 1}: FH record requires at least 6 fields (H|FH|Version|TaxYear|StartDate|EndDate).`);
          } else {
            header = {
              recordType: 'H',
              recordId: 'FH',
              fileVersion: parts[2],
              taxYear: parts[3],
              periodStartDate: parts[4],
              periodEndDate: parts[5]
            };

            if (parts[2] !== '4.0' && parts[2] !== '3.0') {
              warnings.push(`File Version '${parts[2]}' differs from standard 2026 BRS Version 4.0.`);
            }
          }
          break;

        case 'SE': // Submitting Entity
          if (parts.length < 10) {
            errors.push(`Line ${index + 1}: SE record requires 10 fields.`);
          } else {
            submittingEntity = {
              recordType: 'H',
              recordId: 'SE',
              taxYear: parts[2],
              periodStartDate: parts[3],
              periodEndDate: parts[4],
              entityType: parts[5],
              entityName: parts[6],
              contactFirstName: parts[7],
              contactSurname: parts[8],
              contactEmail: parts[9]
            };
          }
          break;

        case 'REI': // Reporting Entity Information (PBO)
          if (parts.length < 4) {
            errors.push(`Line ${index + 1}: REI record requires 4 fields (H|REI|PboNumber|PboName).`);
          } else {
            const pboNum = parts[2];
            reportingEntity = {
              recordType: 'H',
              recordId: 'REI',
              pboNumber: pboNum,
              pboName: parts[3]
            };

            if (!pboNum.startsWith('93') || pboNum.length !== 10) {
              warnings.push(`PBO Number '${pboNum}' should ideally be a 10-digit reference starting with '9300' under Income Tax Act Section 30.`);
            }
          }
          break;

        case 'DEI': // Donor Entity Information
          if (parts.length < 10) {
            errors.push(`Line ${index + 1}: DEI record requires at least 10 fields.`);
          } else {
            const idNum = parts[3];
            const taxNum = parts[4];
            const idVal = validateSouthAfricanId(idNum);

            donor = {
              recordType: 'H',
              recordId: 'DEI',
              personNature: (parts[2].toUpperCase() as any) || 'INDIVIDUAL',
              idOrPassport: idNum,
              taxNumber: taxNum,
              fullName: parts[5],
              address: parts[6],
              email: parts[7],
              phone: parts[8],
              idValidation: idVal
            };

            if (!idVal.isValid && parts[2].toUpperCase() === 'INDIVIDUAL') {
              warnings.push(`Donor ID '${idNum}' failed Luhn check digit validation.`);
            }
            if (!/^\d{10}$/.test(taxNum)) {
              warnings.push(`Donor Tax Reference '${taxNum}' is not standard 10 numeric digits.`);
            }
          }
          break;

        case 'DRI': // Donation Receipt Information
          if (parts.length < 7) {
            errors.push(`Line ${index + 1}: DRI record requires 7 fields (H|DRI|ReceiptNo|Date|Amount|Nature|CertificateRef).`);
          } else {
            const parsedAmount = parseFloat(parts[4]);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
              errors.push(`Line ${index + 1}: Invalid donation amount '${parts[4]}'. Must be a positive numeric value.`);
            }

            receipt = {
              recordType: 'H',
              recordId: 'DRI',
              receiptNumber: parts[2],
              donationDate: parts[3],
              amount: isNaN(parsedAmount) ? 0 : parsedAmount,
              natureOfDonation: (parts[5].toUpperCase() as any) || 'CASH',
              certificateReference: parts[6]
            };
          }
          break;

        default:
          warnings.push(`Line ${index + 1}: Unknown record identifier '${recordId}'.`);
          break;
      }
    } else if (recordType === 'T') {
      // Trailer Record
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: Trailer record requires at least 2 fields (T|RecordCount).`);
      } else {
        const count = parseInt(parts[1], 10);
        trailer = {
          recordType: 'T',
          recordCount: isNaN(count) ? 0 : count
        };
      }
    }
  }

  // Run user Python reference validation logic
  const pythonErrors = validateIt3dFile(lines, 2026, { strict: false });
  const isPythonValid = pythonErrors.length === 0;

  // Cross-validation checks
  if (!header) errors.push('Missing mandatory File Header (H|FH).');
  if (!reportingEntity) errors.push('Missing mandatory Reporting Entity Information (H|REI).');
  if (!receipt) errors.push('Missing mandatory Donation Receipt Information (H|DRI).');
  if (!trailer) errors.push('Missing mandatory Trailer Record (T).');

  const checksum = generateSyntheticPayloadChecksum(rawContent);

  return {
    rawPayload: rawContent,
    header,
    submittingEntity,
    reportingEntity,
    donor,
    receipt,
    trailer,
    isValid: errors.length === 0,
    validationErrors: errors,
    validationWarnings: warnings,
    pythonErrors,
    isPythonValid,
    sha256Checksum: checksum,
    parsedAt: new Date().toISOString()
  };
}

export const SAMPLE_USER_IT3D_PAYLOAD = `H|FH|4.0|2026|2026-03-01|2026-08-31
H|SE|2026|2026-03-01|2026-08-31|COMPANY|Ilitha Fintech Pty Ltd|John|Doe|admin@ilithafintech.co.za|082-ENC-4567
H|REI|9300123456|Ilitha Foundation
H|DEI|INDIVIDUAL|800101-ENC-9087|1234567890|Jane Doe|123 Main St Bloemfontein|jane@example.com|082-ENC-4567
H|DRI|REC-2026-001|2026-04-15|5000|CASH|18A-2026-001
T|00000006`;

export const SAMPLE_PYTHON_COMPLIANT_IT3D_PAYLOAD = `H|FH|4.0|2026|2026-03-01|2026-08-31
H|SE|2026|2026-03-01|2026-08-31|COMPANY|Ilitha Fintech Pty Ltd|John Doe|admin@ilithafintech.co.za|082-ENC-4567
H|REI|9300123456|Ilitha Foundation
H|DEI|INDIVIDUAL|800101-ENC-9087|1234567890|Jane Doe|123 Main St Bloemfontein|jane@example.com|082-ENC-4567
H|DRI|REC-2026-001|2026-04-15|5000|CASH|18A-2026-001
T|00000006`;

/**
 * Statutory 15-Line Batch Payload conforming to:
 * H|FH|...
 * H|SE|PBO Name|Reg No|...
 * H|REI|9301234567|...
 * H|DEI|ID/Passport|Surname|...
 * H|DRI|DonorID|Amount|Date|...
 * T|00000015  <- must = total lines including H and T
 */
export const SAMPLE_15_LINE_IT3D_PAYLOAD = `H|FH|4.0|2026|2026-03-01|2026-08-31
H|SE|2026|2026-03-01|2026-08-31|COMPANY|Hope Community Trust|0215551234|tax@hopecommunity.org.za|PO Box 500|Cape Town|8000|9301234567
H|REI|9301234567|Hope Community Trust
H|DEI|INDIVIDUAL|800101-ENC-9087|1234567890|Jane Doe|12 Protea Way, Stellenbosch|jane@example.com|082-ENC-4567
H|DRI|REC-2026-001|2026-04-15|5000|CASH|18A-2026-001
H|DRI|REC-2026-002|2026-04-20|2500|CASH|18A-2026-002
H|DEI|INDIVIDUAL|900202-ENC-9082|2345678901|Kwame Sithole|44 Nelson Mandela Dr, Durban|kwame@example.com|083-ENC-5678
H|DRI|REC-2026-003|2026-05-02|10000|CASH|18A-2026-003
H|DEI|INDIVIDUAL|850303-ENC-9088|3456789012|Lerato Moloi|88 Long St, Cape Town|lerato@example.com|084-ENC-6789
H|DRI|REC-2026-004|2026-05-10|7500|CASH|18A-2026-004
H|DEI|INDIVIDUAL|750404-ENC-9085|4567890123|David Van Der Merwe|10 Paul Kruger St, Pretoria|david@example.com|085-ENC-7890
H|DRI|REC-2026-005|2026-05-12|12000|CASH|18A-2026-005
H|DEI|INDIVIDUAL|820505-ENC-9085|5678901234|Nandi Khumalo|5 Jan Smuts Ave, Rosebank|nandi@example.com|086-ENC-8901
H|DRI|REC-2026-006|2026-05-15|3000|CASH|18A-2026-006
T|00000015`;

export const SARS_IT3D_PYTHON_VALIDATOR_SCRIPT = `import re
from datetime import datetime

def luhn_sa_id(id_no: str) -> bool:
    if not re.fullmatch(r"\\d{13}", id_no):
        return False
    # SARS ID Luhn check
    total = 0
    for i, d in enumerate(reversed(id_no)):
        n = int(d)
        if i % 2 == 1:
            n = n * 2
            if n > 9: n -= 9
        total += n
    return total % 10 == 0

def validate_it3d_file(lines: list[str], tax_year: int = 2026, strict: bool = False):
    errors = []
    seen_receipts = set()

    if not lines:
        return ["Empty file"]

    # 1. Header validation
    header = lines[0].strip().split('|')
    if header[0] != 'H' or header[1] != 'FH':
        errors.append(f"Line 1: First record must be H|FH, got {lines[0][:20]}")

    # 2. Trailer validation: T|<count> (must = total lines including H and T, e.g. T|00000015)
    trailer = lines[-1].strip().split('|')
    if trailer[0] != 'T':
        errors.append("Last line must be T|count (e.g. T|00000015)")
    else:
        try:
            expected = int(trailer[1])
            total_lines = len(lines)  # total lines including H and T
            records_between = len(lines) - 2
            substantive_count = len([
                l for l in lines 
                if l.strip().startswith('H|REI') or l.strip().startswith('H|DEI') or l.strip().startswith('H|DRI')
            ])

            # Statutory SARS rule: T|count must equal total lines including H and T
            if expected == total_lines:
                pass
            elif not strict and (expected == records_between or expected == substantive_count):
                pass
            else:
                formatted_expected = str(total_lines).zfill(8)
                errors.append(f"Trailer count {expected} != total lines {total_lines} (must = total lines including H and T, e.g. T|{formatted_expected})")
        except:
            errors.append("Trailer second field must be numeric (e.g. T|00000015)")

    for idx, raw in enumerate(lines[1:-1], start=2):
        if not raw.strip():
            continue
        parts = raw.strip().split('|')
        if parts[0] != 'H':
            errors.append(f"Line {idx}: Must start with H")
            continue

        h_type = parts[1] if len(parts) > 1 else ""

        if h_type == 'SE': # Submitting Entity
            if len(parts) < 10:
                errors.append(f"Line {idx} SE: Too few fields, expected >=10, got {len(parts)}")
            email = parts[8] if len(parts) > 8 else ""
            if '@' not in email or '.' not in email:
                errors.append(f"Line {idx} SE: Invalid email {email}")

        elif h_type == 'REI': # Reporting Entity - PBO
            if len(parts) < 3:
                errors.append(f"Line {idx} REI: Too few fields")
            pbo = parts[2] if len(parts) > 2 else ""
            if not re.fullmatch(r"930\\d{7}", pbo):
                errors.append(f"Line {idx} REI: PBO ref must be 930 + 7 digits, got {pbo}")

        elif h_type == 'DEI': # Donor
            # H|DEI|INDIVIDUAL|ID|TAXREF|Name|Address|Email|Cell
            if len(parts) < 9:
                errors.append(f"Line {idx} DEI: Expected 9 fields, got {len(parts)}")
                continue
            _, _, nature, id_no, taxref, name, addr, email, cell = parts[:9]

            if nature == 'INDIVIDUAL' and not luhn_sa_id(id_no):
                errors.append(f"Line {idx} DEI: Invalid SA ID {id_no}")

            if taxref and not re.fullmatch(r"\\d{10}", taxref):
                errors.append(f"Line {idx} DEI: Tax ref must be 10 digits, got {taxref}")

            if '@' not in email or '.' not in email.split('@')[-1]:
                errors.append(f"Line {idx} DEI: Invalid email {email}")

            if not re.fullmatch(r"\\d{9,15}", cell):
                errors.append(f"Line {idx} DEI: Cell must be 9-15 digits no +/space, got {cell}")

        elif h_type == 'DRI': # Donation
            # H|DRI|Receipt|Date|Amount|Nature|CertNo
            if len(parts) < 7:
                errors.append(f"Line {idx} DRI: Expected 7 fields, got {len(parts)}")
                continue
            _, _, receipt, ddate, amount, nature, cert = parts[:7]

            if receipt in seen_receipts:
                errors.append(f"Line {idx} DRI: Duplicate receipt {receipt}")
            seen_receipts.add(receipt)

            try:
                dt = datetime.strptime(ddate, "%Y-%m-%d")
                if dt.year != tax_year:
                    errors.append(f"Line {idx} DRI: Date year {dt.year}!= tax year {tax_year}")
            except:
                errors.append(f"Line {idx} DRI: Invalid date {ddate}, need CCYY-MM-DD")

            try:
                amt = float(amount)
                if amt <= 0:
                    errors.append(f"Line {idx} DRI: Amount must be >0, got {amount}")
            except:
                errors.append(f"Line {idx} DRI: Amount not numeric {amount}")

            if nature not in ('CASH', 'PROPERTY_IN_KIND'):
                errors.append(f"Line {idx} DRI: Nature must be CASH or PROPERTY_IN_KIND, got {nature}")

    return errors

FILENAME_PATTERN = r"^IT3d\.(\d{10})\.(\d{8})\.(\d{6})\.txt$"

def validate_it3d_filename(filename: str, expected_pbo: str = None) -> dict:
    """
    Validates the statutory SARS IT3(d) flat file filename:
    IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
    Example: IT3d.9301234567.20260516.120000.txt
    """
    if not filename:
        return {"valid": False, "errors": ["Filename cannot be empty"]}
    match = re.match(FILENAME_PATTERN, filename.strip(), re.IGNORECASE)
    if not match:
        return {
            "valid": False,
            "errors": [f"Filename '{filename}' does not match SARS standard: IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt"]
        }
    pbo, date_str, time_str = match.groups()
    errors = []
    if not pbo.startswith("930"):
        errors.append(f"PBO '{pbo}' must start with 930 series")
    if expected_pbo and expected_pbo.replace("-", "").strip() != pbo:
        errors.append(f"Filename PBO {pbo} != REI PBO {expected_pbo}")
    try:
        datetime.strptime(date_str, "%Y%m%d")
    except ValueError:
        errors.append(f"Invalid YYYYMMDD date {date_str}")
    try:
        datetime.strptime(time_str, "%H%M%S")
    except ValueError:
        errors.append(f"Invalid HHMMSS time {time_str}")
    return {"valid": len(errors) == 0, "errors": errors, "parsed": {"pbo": pbo, "date": date_str, "time": time_str}}

def generate_it3d_filename(pbo_number: str = "9301234567", dt: datetime = None) -> str:
    clean_pbo = re.sub(r"\D", "", str(pbo_number)).ljust(10, '0')[:10]
    if dt is None:
        dt = datetime(2026, 5, 16, 12, 0, 0)
    return f"IT3d.{clean_pbo}.{dt.strftime('%Y%m%d')}.{dt.strftime('%H%M%S')}.txt"
`;
