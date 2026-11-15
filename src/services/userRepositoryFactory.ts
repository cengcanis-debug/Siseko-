// services/userRepositoryFactory.ts
import { IUserRepository } from '../types/user';
import { MockUserRepository } from './mockUserRepository';
import { ApiUserRepository } from './apiUserRepository';

function readEnvVar(key: 'VITE_DATA_SOURCE' | 'VITE_SANDBOX_API_URL'): string | undefined {
  const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

const defaultDataSource = readEnvVar('VITE_DATA_SOURCE') || 'mock';
const defaultSandboxApiUrl = readEnvVar('VITE_SANDBOX_API_URL') || '/api';

export class UserRepositoryFactory {
  static create(options?: {
    dataSource?: 'mock' | 'api' | string;
    sandboxApiUrl?: string;
    getHeaders?: () => Record<string, string>;
  }): IUserRepository {
    const dataSource = (options?.dataSource ?? defaultDataSource).toLowerCase();
    const sandboxApiUrl = options?.sandboxApiUrl ?? defaultSandboxApiUrl;

    if (dataSource === 'api') {
      console.info('🔌 Connected to Sandbox API:', sandboxApiUrl);
      return new ApiUserRepository(sandboxApiUrl, {
        getHeaders: options?.getHeaders
      });
    }

    console.info('🧪 Connected to Local Mock Data Adapter');
    return new MockUserRepository();
  }
}

// Export a single instantiated repository singleton to use across the app
export const userRepository: IUserRepository = UserRepositoryFactory.create();
