'use client';

/**
 * @fileoverview ログインページコンポーネント
 * @description ユーザー認証のためのログインフォームを表示するページコンポーネント
 * @created 2025-06-29
 * @updated 2025-06-29
 */

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(`/profile/${user.id}`);
    }
  }, [loading, user]);

  return (
    <main>
      <h1>ログインページ</h1>
      <LoginForm />
    </main>
  );
}
