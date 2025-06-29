'use client';

import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

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
      {tabs.map(({ href, label, icon }) => (
        <Link href={href} key={href}>
          <div className={`nav-item ${pathname === href ? 'active' : ''}`}>
            <Image src={icon} alt={`${label} Icon`} width={24} height={24} />
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}
