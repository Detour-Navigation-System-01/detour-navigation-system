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
