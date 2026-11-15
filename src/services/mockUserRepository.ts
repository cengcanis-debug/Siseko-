// services/mockUserRepository.ts
import { IUserRepository, User } from '../types/user';
import { validateUserPatch } from './userRepository';

const DEFAULT_MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Mock', email: 'alice@example.com', status: 'active' },
  { id: '2', name: 'Bob Sandbox-Test', email: 'bob@example.com', status: 'pending' }
];

export class MockUserRepository implements IUserRepository {
  private mockUsers: User[];
  private simulatedLatencyMs: number;

  constructor(options?: { initialUsers?: User[]; simulatedLatencyMs?: number }) {
    this.mockUsers = (options?.initialUsers || DEFAULT_MOCK_USERS).map(u => ({ ...u }));
    this.simulatedLatencyMs = options?.simulatedLatencyMs ?? 300;
  }

  private async delay(): Promise<void> {
    if (this.simulatedLatencyMs <= 0) return;
    await new Promise(resolve => setTimeout(resolve, this.simulatedLatencyMs));
  }

  async getUser(id: string): Promise<User> {
    await this.delay();
    const user = this.mockUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found in mock store');
    return { ...user };
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await this.delay();
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found in mock store');

    const sanitized = validateUserPatch(data);
    this.mockUsers[index] = { ...this.mockUsers[index], ...sanitized, id };
    return { ...this.mockUsers[index] };
  }
}
