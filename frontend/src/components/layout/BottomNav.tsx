'use client';

import Image from 'next/image';
import './BottomNav.css';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleProfileClick = () => {
    console.log('🧭 現在のuser:', user);
    if (user) {
      router.push(`/profile/${user.id}`);
    } else {
      router.push('/login');
    }
  };

  return (
    <nav className="bottom-nav">
      <div
        className={`nav-item ${pathname === '/' ? 'active' : ''}`}
        onClick={() => router.push('/')}
      >
        <Image src="/icons/map.svg" alt="Map Icon" width={24} height={24} />
        <span>マップ</span>
      </div>

      <div
        className={`nav-item ${pathname === '/preservation' ? 'active' : ''}`}
        onClick={() => router.push('/preservation')}
      >
        <Image src="/icons/preserve.svg" alt="Preserve Icon" width={24} height={24} />
        <span>ギャラリー</span>
      </div>

      <div
        className={`nav-item ${pathname.startsWith('/profile') || pathname === '/login' ? 'active' : ''}`}
        onClick={handleProfileClick}
      >
        <Image src="/icons/profile.svg" alt="Profile Icon" width={24} height={24} />
        <span>プロフィール</span>
      </div>
    </nav>
  );
}
