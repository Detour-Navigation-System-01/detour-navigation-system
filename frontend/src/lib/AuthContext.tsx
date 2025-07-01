'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetcher } from '@/lib/api';

type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
} | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
}>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

const fetchUser = async () => {
  console.log('🔍 fetchUser start');

  if (typeof window === 'undefined') {
    console.log('🧨 サーバーサイドでfetchUserが実行されました');
    return; // サーバーでは何もしない
  }

  const token = localStorage.getItem('jwt_token');
  console.log('🔑 トークン:', token);

  if (!token) {
    setUser(null);
    setLoading(false);
    return;
  }

  try {
    const res = await fetcher<{ data?: { user: User } }>('/api/auth/me');
    console.log('🎯 /me の返り値:', res);
    setUser(res.data?.user || null);
    console.log('✅ setUser 呼び出し後 user:', res.data?.user || null);
    console.log('🧭 BottomNav user:', user);

  } catch {
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
