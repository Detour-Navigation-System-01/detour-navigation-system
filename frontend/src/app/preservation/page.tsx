/**
 * @fileoverview 保存スポットコンポーネント
 * @description ログインによるページ遷移判定
 * @author 平野
 * @created 2025-07-03
 * @updated 2025-07-03
 * @version 1.0.0
 */


'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function PreservationRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(`/preservation/${user.id}`);
      } else {
        router.push('/login');
      }
    }
  }, [loading, user]);

  return <p>読み込み中...</p>;
}
