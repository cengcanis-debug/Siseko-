import crypto from 'crypto';

// MUST be set in AI Studio > Secrets as AES_KEY (base64 32 bytes)
const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const AES_KEY_B64 = process.env.AES_KEY;
  if (!AES_KEY_B64) {
    throw new Error("AES_KEY env missing - set in AI Studio Secrets");
  }
  return Buffer.from(AES_KEY_B64, 'base64'); // 32 bytes = AES-256
}

// ENCRYPT for storage in data/students.json / DB
export function encryptPII(plain: string): string {
  const KEY = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store as iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

// DECRYPT - only Senior Practitioner role, never Bookkeeper
export function decryptPII(payload: string): string {
  const KEY = getKey();
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted PII format (expected iv:tag:ciphertext)");
  }
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

// MASKING for UI - what your screenshot now shows correctly
export function maskEmail(emailOrEncrypted: string): string {
  try {
    // if it's encrypted, decrypt first then mask
    if (emailOrEncrypted && emailOrEncrypted.includes(':')) {
      const plain = decryptPII(emailOrEncrypted);
      return maskEmail(plain);
    }
  } catch {}
  // POPIA display rule
  if (!emailOrEncrypted || !emailOrEncrypted.includes('@')) return '[EMAIL MASKED]';
  return '[EMAIL MASKED]';
}

export function maskName(fullName: string): string {
  if (!fullName) return '[NAME MASKED]';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] + ' [MASKED]';
  // Standard POPIA minimization: First initial + Last Name (e.g. S Dlamini)
  return `${parts[0][0]} ${parts[parts.length - 1]}`;
}

export function maskSAId(idNumber: string): string {
  return '[SA ID MASKED]'; // never show 13-digit
}
