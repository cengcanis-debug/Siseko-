// hooks/useUser.ts
import { useState, useEffect, useCallback } from 'react';
import { IUserRepository, User } from '../types/user';
import { userRepository } from '../services/userRepositoryFactory';

export function useUser(userId: string, repository: IUserRepository = userRepository) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (isCancelled?: () => boolean) => {
    if (!userId) {
      if (!isCancelled?.()) {
        setUser(null);
        setError(null);
        setLoading(false);
      }
      return;
    }

    if (!isCancelled?.()) {
      setLoading(true);
      setError(null);
    }

    try {
      const fetched = await repository.getUser(userId);
      if (!isCancelled?.()) {
        setUser(fetched);
      }
    } catch (err: any) {
      console.error(err);
      if (!isCancelled?.()) {
        setError(err?.message || 'Failed to load user');
      }
    } finally {
      if (!isCancelled?.()) {
        setLoading(false);
      }
    }
  }, [userId, repository]);

  useEffect(() => {
    let cancelled = false;
    loadUser(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const updateUser = useCallback(
    async (data: Partial<User>): Promise<User> => {
      if (!userId) {
        throw new Error('Cannot update user without a valid userId');
      }
      setError(null);
      try {
        const updated = await repository.updateUser(userId, data);
        setUser(updated);
        return updated;
      } catch (err: any) {
        const message = err?.message || 'Failed to update user';
        setError(message);
        throw err;
      }
    },
    [userId, repository]
  );

  const refresh = useCallback(() => loadUser(), [loadUser]);

  return { user, loading, error, updateUser, refresh };
}
