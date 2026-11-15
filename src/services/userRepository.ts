import { TeamMember } from '../types';
import { IUserRepository, User, UserStatus } from '../types/user';

const VALID_USER_STATUSES: readonly UserStatus[] = ['active', 'pending', 'suspended'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mapTeamStatusToUserStatus(status: TeamMember['status']): UserStatus {
  if (status === 'Suspended') return 'suspended';
  if (status === 'Pending Invite') return 'pending';
  return 'active';
}

export function mapUserStatusToTeamStatus(status: UserStatus): TeamMember['status'] {
  if (status === 'suspended') return 'Suspended';
  if (status === 'pending') return 'Pending Invite';
  return 'Active';
}

export function teamMemberToUser(member: TeamMember): User {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    status: mapTeamStatusToUserStatus(member.status)
  };
}

export function validateUserPatch(data: Partial<User>): Partial<Omit<User, 'id'>> {
  const sanitized: Partial<Omit<User, 'id'>> = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) {
      throw new Error('User name must be at least 2 characters.');
    }
    sanitized.name = trimmed;
  }

  if (data.email !== undefined) {
    const trimmedEmail = data.email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Valid email address is required.');
    }
    sanitized.email = trimmedEmail;
  }

  if (data.status !== undefined) {
    if (!VALID_USER_STATUSES.includes(data.status)) {
      throw new Error(`Invalid user status "${String(data.status)}". Expected active, pending, or suspended.`);
    }
    sanitized.status = data.status;
  }

  return sanitized;
}

/**
 * In-memory / state-backed IUserRepository adapter over TeamMember records.
 * Keeps UI state, TeamMember permissions, and optional backend sync consistent.
 */
export class TeamMemberUserRepository implements IUserRepository {
  private getMembers: () => TeamMember[];
  private applyMemberUpdate: (id: string, updates: Partial<TeamMember>) => void;
  private onRemoteSync?: (id: string, patch: Partial<User>) => void;

  constructor(options: {
    getMembers: () => TeamMember[];
    applyMemberUpdate: (id: string, updates: Partial<TeamMember>) => void;
    onRemoteSync?: (id: string, patch: Partial<User>) => void;
  }) {
    this.getMembers = options.getMembers;
    this.applyMemberUpdate = options.applyMemberUpdate;
    this.onRemoteSync = options.onRemoteSync;
  }

  async getUser(id: string): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new Error('User ID is required.');
    }
    const member = this.getMembers().find(m => m.id === id);
    if (!member) {
      throw new Error(`User not found: ${id}`);
    }
    return teamMemberToUser(member);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const existing = this.getMembers().find(m => m.id === id);
    if (!existing) {
      throw new Error(`User not found: ${id}`);
    }

    const sanitized = validateUserPatch(data);
    const memberPatch: Partial<TeamMember> = {};

    if (sanitized.name !== undefined) {
      memberPatch.name = sanitized.name;
    }
    if (sanitized.email !== undefined) {
      memberPatch.email = sanitized.email;
    }
    if (sanitized.status !== undefined) {
      memberPatch.status = mapUserStatusToTeamStatus(sanitized.status);
    }

    const updatedMember: TeamMember = {
      ...existing,
      ...memberPatch
    };

    this.applyMemberUpdate(id, memberPatch);
    this.onRemoteSync?.(id, sanitized);

    return teamMemberToUser(updatedMember);
  }
}

/**
 * HTTP-backed IUserRepository client communicating with /api/users/:id endpoints.
 */
export class HttpUserRepository implements IUserRepository {
  private baseUrl: string;
  private getAuthHeaders: () => Record<string, string>;

  constructor(options?: {
    baseUrl?: string;
    getAuthHeaders?: () => Record<string, string>;
  }) {
    this.baseUrl = options?.baseUrl || '';
    this.getAuthHeaders = options?.getAuthHeaders || (() => ({}));
  }

  async getUser(id: string): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new Error('User ID is required.');
    }
    const res = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Failed to load user ${id} (${res.status}).`);
    }
    return payload.user || payload;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new Error('User ID is required.');
    }
    const sanitized = validateUserPatch(data);
    const res = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(sanitized)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Failed to update user ${id} (${res.status}).`);
    }
    return payload.user || payload;
  }
}
