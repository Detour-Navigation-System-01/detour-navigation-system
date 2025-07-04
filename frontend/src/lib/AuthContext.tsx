'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetcher } from '@/lib/api';
import type { User } from '@/types/user'; // ✅ public_settings を含む型に統一

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    console.log('🔍 fetchUser start');

    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('jwt_token');
    console.log('🔑 トークン:', token);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetcher<{ data?: { user: User } }>('/api/auth/me');
      setUser(res.data?.user || null); // ✅ public_settings をそのまま受け取る
    } catch (err) {
      console.warn('⚠️ /me 取得失敗:', err);
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
