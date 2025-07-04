/**
 * @fileoverview プロフィール設定画面（公開設定など）
 * @description ユーザーのプロフィールに関する設定を切り替えるUIを提供。
 *              現在は「スポットの公開可否」および仮の「その他設定」をトグルスイッチ形式で実装。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-04
 * @version 2.2.3
 */
'use client';

import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { User } from '@/types/user';
import { useRouter } from 'next/navigation';

interface Props {
  user: User;
}

export default function ProfileSettings({ user }: Props) {
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof user.public_settings === 'boolean') {
      setIsPublic(user.public_settings);
    }
  }, [user.public_settings]);

  const handleToggle = async () => {
    const next = !isPublic;
    setIsPublic(next); // UIに反映

    try {
      await fetcher(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ public_settings: next }),
      });
      await refresh();
    } catch (err: any) {
      console.error('❌ 公開設定更新失敗:', err);
      alert(err.message || '公開設定の更新に失敗しました');
      setIsPublic(!next); // 元に戻す
    }
  };

  const handleLogout = async () => {
    try {
      await fetcher('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('jwt_token');
      await refresh();
      router.push('/login');
    } catch (err: any) {
      console.error('❌ ログアウト失敗:', err);
      alert(err.message || 'ログアウトに失敗しました');
    }
  };

  return (
    <div style={settingsContainer}>
      <div style={toggleItemStyle}>
        <span>自分の保存したスポットを外部に公開する</span>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={handleToggle}
          style={toggleStyle}
        />
      </div>

      <button onClick={handleLogout} style={logoutButtonStyle}>
        ログアウト
      </button>
    </div>
  );
}

const settingsContainer: React.CSSProperties = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const toggleItemStyle: React.CSSProperties = {
  backgroundColor: '#F7F7F7',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
};

const toggleStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
};

const logoutButtonStyle: React.CSSProperties = {
  marginTop: '24px',
  alignSelf: 'center',
  backgroundColor: '#DD6666',
  color: 'white',
  padding: '10px 24px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
};
