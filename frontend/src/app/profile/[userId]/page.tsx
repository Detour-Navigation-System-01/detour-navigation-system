'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div style={containerStyle}>
      {/* ヘッダー部分 */}
      <div style={headerStyle}>
        <Image
          src="/default-user-icon.png" // 仮の画像
          alt="プロフィール画像"
          width={120}
          height={120}
          style={{ borderRadius: '50%', marginBottom: '12px' }}
        />
        <h2 style={nameStyle}>test</h2>
        <p style={idStyle}>test</p>
        <Link href="/profile/${user.id}/edit">
          <button style={editButtonStyle}>編集</button>
        </Link>
      </div>

      {/* 設定トグル */}
      <div style={settingsContainer}>
        <SettingToggle label="自分の保存したスポットを外部に公開する" />
        <SettingToggle label="何かしらの設定" />
      </div>
    </div>
  );
}

function SettingToggle({ label }: { label: string }) {
  return (
    <div style={toggleItemStyle}>
      <span>{label}</span>
      <input type="checkbox" defaultChecked style={toggleStyle} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'sans-serif',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fff',
  minHeight: '100vh',
};

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
