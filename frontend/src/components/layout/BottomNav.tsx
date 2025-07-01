'use client';

import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userId = user?.id;

  const tabs = [
    {
      href: '/',
      label: 'Map',
      icon: '/icons/map.svg'
    },
    {
      href: userId
        ? `/preservation/${userId}`
        : '/login?redirect=/preservation', // userIdなしでも機能する
      label: 'Preserve',
      icon: '/icons/preserve.svg'
    },
    {
      href: userId ? `/profile/${userId}` : '/login',
      label: 'Profile',
      icon: '/icons/profile.svg'
    }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, icon }) => (
        <Link href={href} key={label}>
          <div className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}>
            <Image src={icon} alt={`${label} Icon`} width={24} height={24} />
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}
