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
