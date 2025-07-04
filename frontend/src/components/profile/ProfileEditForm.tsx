/**
 * @fileoverview プロフィール編集フォーム
 * @description ユーザーの名前とプロフィール公開設定を編集するフォームコンポーネント。
 * @author 赤津
 * @created 2025-06-12
 * @updated 2025-07-04
 * @version 2.1.2
 */

'use client';

import { useState } from 'react';
import { User } from '@/types/user';

type Props = {
  user: User;
};

export default function ProfileEditForm({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [isPublic, setIsPublic] = useState(user.isPublic);

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
