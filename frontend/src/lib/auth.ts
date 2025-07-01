// frontend/src/lib/auth.ts

import { fetcher } from './api';

export const fetchCurrentUser = async () => {
  return await fetcher<{ data?: { user: { id: number; username: string } } }>(
    '/api/auth/me'
  );
};

export const logout = async () => {
  return await fetcher<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
};
