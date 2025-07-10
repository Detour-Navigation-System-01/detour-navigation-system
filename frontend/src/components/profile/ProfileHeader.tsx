/**
 * @fileoverview プロフィールページヘッダ
 * @description プロフィール画面のヘッダ設定
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-07
 * @version 1.6.0
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '@/types/user';
import { API_BASE, fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  user: User;
}

export default function ProfileHeader({ user }: Props) {
  const { refresh } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`${API_BASE}/api/users/profile-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
      alert('プロフィール画像を更新しました');
    } catch (err: any) {
      console.error('❌ 画像アップロード失敗:', err);
      alert(err.message || '画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={headerStyle}>
      {/* プロフィール画像 */}
      <img
        src={user.image_url || '/icons/user-placeholder.svg'}
        alt="プロフィール画像"
        width={120}
        height={120}
        style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }}
      />

      {/* アップロードボタン（label + hidden input） */}
      <label style={{ ...uploadButtonStyle, opacity: uploading ? 0.6 : 1 }}>
        {uploading ? 'アップロード中...' : '画像を選択'}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      <h2 style={nameStyle}>{user.username}</h2>
      <Link href={`/profile/${user.id}/edit`}>
        <button style={editButtonStyle}>編集</button>
      </Link>
    </div>
  );
}

// --- スタイル定義 ---
const headerStyle: React.CSSProperties = {
  backgroundColor: '#74A799',
  paddingTop: '48px',
  paddingBottom: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: '#fff',
};

const nameStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '4px',
  color: '#000',
};

const editButtonStyle: React.CSSProperties = {
  backgroundColor: '#2563eb',          // 明るめの青色
  color: '#fff',
  padding: '10px 24px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease',
};


const uploadButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#333',
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  marginBottom: '12px',
  fontSize: '14px',
  fontWeight: 'bold',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  display: 'inline-block',
};
