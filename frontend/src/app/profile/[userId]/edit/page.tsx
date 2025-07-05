'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  // 初期値は空。userが取得されてから useEffect でセット
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ userが読み込まれたタイミングでフォームに反映
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }

    try {
      await fetcher(`/api/users/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username,
          email,
          ...(password && { password }), // パスワードがあれば送信
        }),
      });

      alert('プロフィールを更新しました');
      await refresh(); // 再取得
      router.push(`/profile/${user?.id}`);
    } catch (err: any) {
      console.error('❌ 更新エラー', err);
      alert(err.message || 'プロフィール更新に失敗しました');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div
        style={{
          backgroundColor: '#74A799',
          paddingTop: '48px',
          textAlign: 'center',
        }}
      >

        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{username}</h2>
        
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div>
          <label>ユーザー名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>パスワード（任意）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{ ...buttonStyle, backgroundColor: '#A6C8B8' }}
          >
            戻る
          </button>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: '#285943',
              color: '#fff',
            }}
          >
            変更
          </button>
        </div>
      </form>
    </div>
  );
}

// --- スタイル定義 ---

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: 'none',
  borderBottom: '2px solid #285943',
  fontSize: '16px',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
};
