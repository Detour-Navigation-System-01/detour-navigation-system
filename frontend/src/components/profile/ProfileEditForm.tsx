// src/components/profile/ProfileEditForm.tsx

'use client';

import { useState } from 'react';
import { User } from '@/types/user';

type Props = {
  user: User;
};

export default function ProfileEditForm({ user }: Props) {
  const [name, setName] = useState(user.username);
  const [isPublic, setIsPublic] = useState(user.public_settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API呼び出しの仮例
    console.log('送信データ:', { name, isPublic });
    alert('プロフィールが更新されました');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>名前：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          プロフィールを公開する
        </label>
      </div>

      <button type="submit">保存</button>
    </form>
  );
}
