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

  const tabs = [
    { href: '/', label: 'マップ', icon: '/icons/map.svg' },
    { href: '/preservation', label: 'ギャラリー', icon: '/icons/preserve.svg' },
    {
      href: user ? `/profile/${user.id}` : '/login',
      label: 'プロフィール',
      icon: '/icons/profile.svg',
    },
  ];

  // ナビゲーション中とカメラ画面ではボトムナビゲーションを非表示
  if (pathname === '/navigating' || pathname === '/camera') {
    return null;
  }
  
  // これらのページではbodyのpaddingを適用
  if (typeof document !== 'undefined') {
    document.body.style.paddingBottom = '70px'; // ナビゲーションバーの高さに合わせて調整
  }


  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, icon }) => {
        const isActive = pathname === href;

        return (
          <Link 
            key={label} 
            href={href} 
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div
              className="icon-wrapper"
              style={{
                transform: isActive ? 'translateY(-6px)' : 'none',
                transition: 'transform 0.2s ease-out',
              }}
            >
              <Image 
                src={icon} 
                alt={label} 
                width={25} 
                height={25} 
                className={label === 'マップ' ? 'map-icon' : ''}
                style={{ objectFit: 'contain' }} 
              />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
