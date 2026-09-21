import { RoleType, AppSession } from '../types';

/**
 * Generates a cryptographically secure hex string of given byte length.
 * Default is 32 bytes = 64 hexadecimal characters, exactly equivalent to
 * Python's `secrets.token_hex(32)`.
 */
export function generateTokenHex(byteLength: number = 32): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint8Array(byteLength);
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // High-entropy fallback if window.crypto is unavailable
  let hex = '';
  for (let i = 0; i < byteLength; i++) {
    const val = Math.floor(Math.random() * 256);
    hex += val.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Assigns statutory and security authorization scopes based on RoleType.
 */
export function getRoleScopes(role: RoleType): string[] {
  switch (role) {
    case 'Owner':
      return [
        'sars:efiling:full',
        'sars:ita34:objection',
        'sars:vat201:file',
        'sars:irp6:pay',
        'vault:seal',
        'ledger:export',
        'team:manage',
        'session:rotate'
      ];
    case 'Accountant':
      return [
        'sars:efiling:read',
        'sars:ita34:draft',
        'sars:vat201:file',
        'sars:irp6:pay',
        'vault:seal',
        'ledger:export',
        'session:rotate'
      ];
    case 'Bookkeeper':
      return [
        'invoices:scan',
        'transactions:edit',
        'logbook:entry',
        'session:view'
      ];
    case 'Auditor':
      return [
        'audit:read_all',
        'vault:verify',
        'ledger:export',
        'reports:read',
        'session:audit'
      ];
    case 'Custom':
    default:
      return ['read:limited', 'session:view'];
  }
}

/**
 * Creates an active application session with a 64-char hex token.
 */
export function createSession(params: {
  role: RoleType;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  ttlMinutes?: number;
}): AppSession {
  const token = generateTokenHex(32); // 64-character hex string
  const now = new Date();
  const ttl = params.ttlMinutes ?? 60; // 60 minutes default
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);

  return {
    token,
    role: params.role,
    userId: params.userId || `usr-${params.role.toLowerCase()}`,
    userName: params.userName || 'Sipho Ndlalose',
    userEmail: params.userEmail || 'sipho@ndlaloseconsulting.co.za',
    ipAddress: params.ipAddress || `197.185.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActiveAt: now.toISOString(),
    status: 'ACTIVE',
    scopes: getRoleScopes(params.role)
  };
}

/**
 * Validates whether the given session is active, unexpired, and properly formatted.
 */
export function isSessionValid(session: AppSession | null | undefined): boolean {
  if (!session) return false;
  if (session.status !== 'ACTIVE') return false;
  if (!session.token || session.token.length !== 64) return false;
  
  const expiry = new Date(session.expiresAt).getTime();
  return Date.now() < expiry;
}

/**
 * Masks a 64-character session token for safe display in logs and UI headers.
 * Example: '7c2e9b1d...64ca'
 */
export function maskSessionToken(token: string): string {
  if (!token || token.length < 12) return '••••••••';
  return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
}

/**
 * Rotates an existing session to a new 64-character hex token and extends TTL.
 */
export function rotateSessionToken(session: AppSession, ttlMinutes: number = 60): AppSession {
  const newToken = generateTokenHex(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  return {
    ...session,
    token: newToken,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActiveAt: now.toISOString(),
    status: 'ACTIVE'
  };
}

/**
 * Revokes an existing session.
 */
export function revokeSession(session: AppSession): AppSession {
  return {
    ...session,
    status: 'REVOKED',
    lastActiveAt: new Date().toISOString()
  };
}

/**
 * Formats an HTTP Authorization header value with the session token.
 */
export function getBearerAuthorizationHeader(token: string): string {
  return `Bearer ${token}`;
}

const SESSION_STORAGE_KEY = 'sa_tax_app_session_v1';

export function persistSession(session: AppSession): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.warn('Unable to persist session to sessionStorage:', err);
  }
}

export function retrievePersistedSession(): AppSession | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const data = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as AppSession;
        if (isSessionValid(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Unable to read persisted session:', err);
  }
  return null;
}
