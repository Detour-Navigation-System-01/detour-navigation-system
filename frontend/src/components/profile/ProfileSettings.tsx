'use client';

import { User } from '@/types/user';
import { useState } from 'react';

type Props = {
  user: User;
};

export default function ProfileSettings({ user }: Props) {
  const [isPublic, setIsPublic] = useState(user.isPublic ?? false);
  const [someSetting, setSomeSetting] = useState(true);

  return (
    <div style={{ padding: '0 24px' }}>
      <label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
        />
        自分の保存したスポットを外部に公開する
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={someSetting}
          onChange={() => setSomeSetting(!someSetting)}
        />
        何かしらの設定
      </label>
    </div>
  );
}
