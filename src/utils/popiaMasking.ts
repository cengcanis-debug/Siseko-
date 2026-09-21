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
