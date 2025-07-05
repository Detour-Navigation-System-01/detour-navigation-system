/**
 * @fileoverview プロフィールヘッダー表示コンポーネント
 * @description ユーザーのプロフィール画像、名前、ユーザー名を中央揃えで表示。
 *              「編集」ボタンを押すことでプロフィール編集ページ（/profile/edit）へ遷移可能。
 *              画像が未設定の場合はデフォルト画像を表示するようフォールバック処理を実装。
 * @author 赤津
 * @created 2025-06-12
 * @updated 2025-07-04
 * @version 2.1.2
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/user';

interface Props {
  user: User;
}

export default function ProfileHeader({ user }: Props) {
  return (
    <div style={headerStyle}>
      <h2 style={nameStyle}>{user.username}</h2>
      <Link href={`/profile/${user.id}/edit`}>
        <button style={editButtonStyle}>編集</button>
      </Link>
    </div>
  );
}

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

const idStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#333',
  marginBottom: '12px',
};

const editButtonStyle: React.CSSProperties = {
  backgroundColor: '#74A799',
  color: 'white',
  padding: '10px 24px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
};
