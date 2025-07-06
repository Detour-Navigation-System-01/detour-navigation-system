/**
 * @fileoverview プロフィールコンポーネント
 * @description ユーザー情報を表示するページコンポーネント
 * @author 平野
 * @created 2025-06-24
 * @updated 2025-07-05
 * @version 2.1.0
 */


'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileSettings from '@/components/profile/ProfileSettings';

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  // ローディング中
  if (loading) {
    return <p>読み込み中...</p>;
  }

  // 未ログイン時 → ログインページへリダイレクト
  if (!user) {
    router.push('/login');
    return null;
  }

  // 正常時に表示
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <ProfileHeader user={user} />
      <ProfileSettings user={user} />
    </div>
  );
}
