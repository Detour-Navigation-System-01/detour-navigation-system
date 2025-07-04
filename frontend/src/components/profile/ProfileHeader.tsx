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
      <p style={idStyle}>ID: {user.id}</p>
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
