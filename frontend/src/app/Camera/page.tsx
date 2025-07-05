/**
 * @fileoverview カメラページコンポーネント
 * @description カメラビューを表示するページコンポーネント（認証付き）
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025-07-04
 * @version 1.1.0
 */

'use client';

import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraView from '@/components/camera/CameraView';

export default function CameraPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/camera'); // ✅ ここを追加
    }
  }, [user, loading]);

  if (loading || !user) return <p>読み込み中...</p>;

  return <CameraView />;
}
