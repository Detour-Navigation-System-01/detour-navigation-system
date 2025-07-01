/**
 * @fileoverview ログインページコンポーネント
 * @description ユーザー認証のためのログインフォームを表示するページコンポーネント
 * @created 2025-06-29
 * @updated 2025-06-29
 */

'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && user) {
      router.push(redirect || `/profile/${user.id}`);
    }
  }, [loading, user, redirect]);

  return (
    <main>
      <h1>ログインページ</h1>
      <LoginForm />
    </main>
  );
}

