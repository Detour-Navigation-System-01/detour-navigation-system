/**
 * @fileoverview ルーティング
 * @description ページ下部のボタンでのルーティング管理
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-05
 * @version 2.1.1
 */


'use client';

import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/auth';

interface User {
  id: number;
  username: string;
}

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetchCurrentUser();
        if (res?.data?.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        console.warn('ユーザ情報取得失敗', e);
      }
    };
    getUser();
  }, []);

  // 🔕 /navigating では非表示
  if (pathname === '/navigating') return null;

  const tabs = [
    { href: '/', label: 'Map', icon: '/icons/map.svg' },
    { href: '/preservation', label: 'Preserve', icon: '/icons/preserve.svg' },
    {
      href: user ? `/profile/${user.id}` : '/login',
      label: 'Profile',
      icon: '/icons/profile.svg',
    },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, icon }) => {
        const isActive = pathname === href;

        return (
          <Link key={label} href={href} className="nav-item">
            <div
              className="icon-wrapper"
              style={{
                transform: isActive ? 'translateY(-6px)' : 'none',
                transition: 'transform 0.2s ease-out',
              }}
            >
              <Image src={icon} alt={label} width={24} height={24} />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
