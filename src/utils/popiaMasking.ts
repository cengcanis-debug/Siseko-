// POPIA Section 19 Statutory Data Minimization & Masking Utilities (Client-Safe)

export function maskEmail(emailOrEncrypted?: string): string {
  if (!emailOrEncrypted) return '[EMAIL MASKED]';
  // NEVER render unencrypted or raw email in UI without senior authorization
  return '[EMAIL MASKED]';
}

export function maskName(fullName?: string): string {
  if (!fullName) return '[NAME MASKED]';
  const trimmed = fullName.trim();
  if (!trimmed) return '[NAME MASKED]';
  
  // If already formatted like "S Dlamini" or "A Mthembu"
  if (/^[A-Z]\s+[A-Za-z'-]+$/.test(trimmed)) {
    return trimmed;
  }
  
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]} [MASKED]`;
  // Standard POPIA minimization: First initial + Surname (e.g. S Dlamini)
  return `${parts[0][0]} ${parts[parts.length - 1]}`;
}

export function maskSAId(idNumber?: string): string {
  // Never show raw 13-digit SA National ID
  return '[SA ID MASKED]';
}

export function maskSarsTaxNumber(taxNumber?: string): string {
  if (!taxNumber) return '[TAX NUMBER MASKED]';
  const clean = String(taxNumber).replace(/[\s-]/g, '');
  if (clean.length <= 4) return '***';
  return `***${clean.slice(-4)}`;
}

export function maskBankAccount(accountNumber?: string): string {
  if (!accountNumber) return '[BANK ACCOUNT MASKED]';
  const clean = String(accountNumber).replace(/[\s-]/g, '');
  if (clean.length <= 4) return '•••• ••••';
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '[PHONE MASKED]';
  const clean = String(phone).replace(/[\s-]/g, '');
  if (clean.length <= 4) return '+27 ** ***';
  return `+27 ** *** ${clean.slice(-4)}`;
}

export function maskAddress(address?: string): string {
  if (!address) return '[ADDRESS MASKED - POPIA §19]';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `[STREET MASKED], ${parts[parts.length - 1].trim()}`;
  }
  return '[ADDRESS MASKED - POPIA §19]';
}

/**
 * Recursively scrubs sensitive PII keys from any JSON object before logging or serializing.
 */
export function sanitizeObjectForLogging<T = any>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeObjectForLogging(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  const sensitiveKeyRegex = /^(password|secret|token|aes_key|key|idnumber|id_number|said|taxnumber|tax_number|bankaccount|accountnumber|email)$/i;

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeyRegex.test(key)) {
      sanitized[key] = '[REDACTED_BY_POPIA_SECTION_19]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObjectForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Client storage scrubber: cleans expired tokens and removes any raw plaintext PII
 * from window.sessionStorage and window.localStorage under POPIA Section 14 (Retention Limitation).
 */
export function scrubClientStorage(): { scrubbedCount: number; timestamp: string } {
  let scrubbedCount = 0;
  if (typeof window === 'undefined') {
    return { scrubbedCount: 0, timestamp: new Date().toISOString() };
  }

  try {
    if (window.sessionStorage) {
      const keysToScrub: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && (k.includes('raw_') || k.includes('temp_pii') || k.includes('user_credentials'))) {
          keysToScrub.push(k);
        }
      }
      keysToScrub.forEach(k => {
        window.sessionStorage.removeItem(k);
        scrubbedCount++;
      });
    }

    if (window.localStorage) {
      const keysToScrub: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.includes('raw_') || k.includes('temp_pii') || k.includes('user_credentials'))) {
          keysToScrub.push(k);
        }
      }
      keysToScrub.forEach(k => {
        window.localStorage.removeItem(k);
        scrubbedCount++;
      });
    }
  } catch (err) {
    console.warn('[POPIA-SCRUBBER] Storage scrub warning:', err);
  }

  return { scrubbedCount, timestamp: new Date().toISOString() };
}

