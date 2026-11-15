// services/apiUserRepository.ts
import { IUserRepository, User } from '../types/user';
import { validateUserPatch } from './userRepository';

function normalizeUserPayload(payload: any): User {
  const raw = payload?.user && typeof payload.user === 'object' ? payload.user : payload;
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.email !== 'string') {
    throw new Error('Invalid user payload returned from API');
  }
  const status = raw.status === 'pending' || raw.status === 'suspended' ? raw.status : 'active';
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    status
  };
}

export class ApiUserRepository implements IUserRepository {
  private baseUrl: string;
  private getHeaders?: () => Record<string, string>;

  constructor(baseUrl: string = '/api', options?: { getHeaders?: () => Record<string, string> }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.getHeaders = options?.getHeaders;
  }

  async getUser(id: string): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new Error('User ID is required');
    }
    const response = await fetch(`${this.baseUrl}/users/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        ...(this.getHeaders ? this.getHeaders() : {})
      }
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.error || 'Failed to fetch user from sandbox API');
    }
    const json = await response.json();
    return normalizeUserPayload(json);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new Error('User ID is required');
    }
    const sanitized = validateUserPatch(data);
    const response = await fetch(`${this.baseUrl}/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getHeaders ? this.getHeaders() : {})
      },
      body: JSON.stringify(sanitized)
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.error || 'Failed to update user in sandbox API');
    }
    const json = await response.json();
    return normalizeUserPayload(json);
  }
}
