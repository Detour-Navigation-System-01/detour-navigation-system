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

import { User } from '@/types/user';
import Link from 'next/link';

type Props = {
  user: User;
};

export default function ProfileHeader({ user }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <img
        src={user.imageUrl || '/images/default-user.svg'}
        alt="ユーザー画像"
        width={120}
        height={120}
        style={{ borderRadius: '50%' }}
      />
      <h2>{user.name}</h2>
      <p>@{user.username}</p>
      <Link href="/profile/edit">
        <button
          style={{
            backgroundColor: '#5d9a8f',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
          }}
        >
          編集
        </button>
      </Link>
    </div>
  );
}
