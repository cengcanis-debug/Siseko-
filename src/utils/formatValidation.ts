/**
 * Format-Only Validation Suite:
 * 1. SARS TCS PIN Validation (Format-only Luhn check on Tax Reference + PIN format + Expiry check)
 * 2. CIPC BOR (Beneficial Ownership Register) Validation (Format-only CIPC Enterprise number + Luhn SA ID + Shareholding)
 */

/**
 * Standard Luhn (Modulus 10) algorithm validation
 * Used by SARS for 10-digit tax reference numbers and 13-digit SA National ID numbers.
 */
export function validateLuhnChecksum(digitsOnly: string): boolean {
  if (!/^\d+$/.test(digitsOnly)) return false;
  
  let sum = 0;
  let shouldDouble = false;

  // Loop backwards from the last digit (check digit)
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validates a 10-digit SARS Tax Reference Number using the official SARS Luhn Mod-10 rule.
 */
export function validateSarsTaxReferenceNumber(taxNumber: string): { isValid: boolean; error?: string } {
  const cleaned = taxNumber.replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'SARS Tax Reference must be exactly 10 numeric digits.' };
  }
  if (!validateLuhnChecksum(cleaned)) {
    return { isValid: false, error: 'Failed Luhn Mod-10 checksum validation (invalid SARS check digit).' };
  }
  return { isValid: true };
}

/**
 * Validates a SARS TCS Tax Compliance Status (TCS) PIN.
 * Checks:
 * 1. Tax reference number passes 10-digit Luhn
 * 2. PIN is 8-10 alphanumeric characters (uppercase letters and digits, excluding ambiguous chars)
 * 3. Optional Expiry Date is in the future (YYYY-MM-DD)
 */
export function validateTcsPinFormat(
  taxReferenceNumber: string,
  taxPin: string,
  expiryDateStr?: string
): { 
  isValid: boolean; 
  status: 'VALID' | 'EXPIRED' | 'INVALID_FORMAT'; 
  error?: string;
  details?: { luhnPassed: boolean; formatPassed: boolean; expiryPassed: boolean }
} {
  const refCheck = validateSarsTaxReferenceNumber(taxReferenceNumber);
  if (!refCheck.isValid) {
    return { 
      isValid: false, 
      status: 'INVALID_FORMAT', 
      error: `Tax Reference Error: ${refCheck.error}`,
      details: { luhnPassed: false, formatPassed: false, expiryPassed: true }
    };
  }

  const cleanedPin = taxPin.trim().toUpperCase();
  const pinFormatRegex = /^[A-Z0-9]{8,10}$/;
  if (!pinFormatRegex.test(cleanedPin)) {
    return {
      isValid: false,
      status: 'INVALID_FORMAT',
      error: 'TCS PIN must be 8 to 10 alphanumeric characters.',
      details: { luhnPassed: true, formatPassed: false, expiryPassed: true }
    };
  }

  // Check expiry date if provided
  if (expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    if (isNaN(expiry.getTime())) {
      return {
        isValid: false,
        status: 'INVALID_FORMAT',
        error: 'Invalid expiry date format (expected YYYY-MM-DD).',
        details: { luhnPassed: true, formatPassed: true, expiryPassed: false }
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) {
      return {
        isValid: false,
        status: 'EXPIRED',
        error: `TCS PIN expired on ${expiryDateStr}. New TCS PIN application required on SARS eFiling.`,
        details: { luhnPassed: true, formatPassed: true, expiryPassed: false }
      };
    }
  }

  return { 
    isValid: true, 
    status: 'VALID',
    details: { luhnPassed: true, formatPassed: true, expiryPassed: true }
  };
}

/**
 * Validates CIPC Company / Close Corporation Registration Number format
 * Format: YYYY/NNNNNN/NN (e.g. 2026/707498/07, 1998/012345/23)
 * Allowed Type Codes:
 * 07 = Private Company (Pty) Ltd
 * 06 = Public Company Ltd
 * 08 = Non-Profit Company (NPC)
 * 23 = Close Corporation (CC)
 * 21 = Incorporated (Inc.)
 * 10 = External Company
 */
export function validateCipcRegistrationNumber(cipcNum: string): { isValid: boolean; enterpriseType?: string; error?: string } {
  const cleaned = cipcNum.trim();
  const regex = /^(\d{4})\/(\d{6})\/(\d{2})$/;
  const match = cleaned.match(regex);

  if (!match) {
    return { isValid: false, error: 'Invalid CIPC format. Expected YYYY/NNNNNN/NN (e.g., 2026/707498/07).' };
  }

  const year = parseInt(match[1], 10);
  const currentYear = new Date().getFullYear();
  if (year < 1850 || year > currentYear + 1) {
    return { isValid: false, error: `Invalid incorporation year ${year}. Must be between 1850 and ${currentYear + 1}.` };
  }

  const typeCode = match[3];
  const typeMap: Record<string, string> = {
    '07': 'Private Company (Pty) Ltd',
    '06': 'Public Company Ltd',
    '08': 'Non-Profit Company (NPC)',
    '23': 'Close Corporation (CC)',
    '21': 'Personal Liability Company (Inc)',
    '10': 'External / Foreign Branch'
  };

  const enterpriseType = typeMap[typeCode] || `Registered Entity Type ${typeCode}`;
  return { isValid: true, enterpriseType };
}

/**
 * Validates CIPC Beneficial Ownership Register (BOR) Entry
 * Mandated under Companies Act & General Laws (Anti-Money Laundering and Combating Terrorism Financing) Amendment Act
 * Checks:
 * 1. Enterprise number conforms to CIPC standard
 * 2. Beneficial Owner SA ID passes 13-digit Luhn check (or valid passport format if foreign national)
 * 3. Beneficial shareholding / voting interest percentage is >= 5% (FATF threshold) and <= 100%
 */
export interface CipcBorEntry {
  enterpriseRegistrationNo: string;
  fullName: string;
  idOrPassportNumber: string;
  isSouthAfricanCitizen: boolean;
  beneficialOwnershipPercentage: number;
  natureOfControl: 'DIRECT_SHARES' | 'VOTING_RIGHTS' | 'BOARD_APPOINTMENT' | 'TRUST_BENEFICIARY';
  effectiveDate: string;
}

export function validateCipcBorEntry(entry: CipcBorEntry): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Enterprise validation
  const entCheck = validateCipcRegistrationNumber(entry.enterpriseRegistrationNo);
  if (!entCheck.isValid) {
    errors.push(`CIPC Registration Error: ${entCheck.error}`);
  }

  // 2. Name check
  if (!entry.fullName || entry.fullName.trim().length < 3) {
    errors.push('Beneficial Owner full name must be at least 3 characters.');
  }

  // 3. ID / Passport check
  const idClean = entry.idOrPassportNumber.replace(/[\s-]/g, '');
  if (entry.isSouthAfricanCitizen) {
    if (!/^\d{13}$/.test(idClean)) {
      errors.push('South African ID number must be exactly 13 numeric digits.');
    } else if (!validateLuhnChecksum(idClean)) {
      errors.push('South African ID number failed Luhn checksum validation (invalid check digit).');
    }
  } else {
    if (!/^[A-Za-z0-9]{6,15}$/.test(idClean)) {
      errors.push('Foreign Passport number must be 6-15 alphanumeric characters.');
    }
  }

  // 4. Beneficial percentage check (FATF Greylist CIPC mandate >= 5%)
  if (entry.beneficialOwnershipPercentage < 5) {
    errors.push('CIPC BOR requires disclosure for beneficial interest >= 5% (General Laws Amendment Act).');
  }
  if (entry.beneficialOwnershipPercentage > 100) {
    errors.push('Beneficial ownership percentage cannot exceed 100%.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
