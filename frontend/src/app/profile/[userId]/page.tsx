'use client';

import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { User } from '@/types/user';

type Props = {
  user: User;
};

export default function ProfileSettings({ user }: Props) {
  const [isPublic, setIsPublic] = useState(user.isPublic ?? false);
  const { refresh } = useAuth();

  // 🔁 userが変わったら状態も更新（ページ遷移対応など）
  useEffect(() => {
    setIsPublic(user.isPublic ?? false);
  }, [user]);

  const handleToggle = async () => {
    const next = !isPublic;
    setIsPublic(next); // ✅ まずローカルの状態を切り替える

    try {
      await fetcher(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ public_settings: next }),
      });
      await refresh(); // 最新状態でAuthContextも更新
    } catch (err: any) {
      console.error('❌ 公開設定更新失敗', err);
      alert(err.message || '公開設定の更新に失敗しました');
      setIsPublic(!next); // 失敗時に元に戻す
    }
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <label>
        <input
          type="checkbox"
          checked={isPublic} // ✅ ローカル状態に基づく
          onChange={handleToggle}
        />
        自分の保存したスポットを外部に公開する
      </label>
    </div>
  );
}
