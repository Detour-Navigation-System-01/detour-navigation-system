'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfileEditPage() {
  const router = useRouter();

  const [username, setUsername] = useState('test');
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }
    // TODO: APIに送信してプロフィールを更新
    alert('プロフィールを更新しました');
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
        <Image
          src="/default-user-icon.png"
          alt="ユーザーアイコン"
          width={120}
          height={120}
          style={{ borderRadius: '50%', marginBottom: '8px' }}
        />
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{username}</h2>
        <p style={{ color: '#333' }}>@alex_marshall</p>
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
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>パスワード（確認用）</label>
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
