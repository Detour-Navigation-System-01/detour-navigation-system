/**
 * @fileoverview ルーティング
 * @description ページ下部のボタンでのルーティング管理
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-05
 * @version 2.1.1
 */


'use client';

import Image from 'next/image';
import './BottomNav.css';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // ナビゲーション中とカメラ画面ではボトムナビゲーションを非表示
  if (pathname === '/navigating' || pathname === '/camera') {
    return null;
  }
  
  // これらのページではbodyのpaddingを適用
  if (typeof document !== 'undefined') {
    document.body.style.paddingBottom = '64px';
  }

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
