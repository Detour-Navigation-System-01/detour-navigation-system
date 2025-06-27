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
