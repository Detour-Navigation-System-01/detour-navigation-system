'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'map', icon: '/icons/map.png' },
    {
      href: '/preservation',
      label: 'Preservation Spot',
      icon: '/icons/preserve.png',
    },
    { href: '/profile', label: 'my profile', icon: '/icons/profile.png' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '64px',
        backgroundColor: '#d8f5e3',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 999,
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: isActive ? '#000' : '#888',
              fontSize: '12px',
            }}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              style={{
                width: 24,
                height: 24,
                marginBottom: 4,
                filter: isActive ? 'none' : 'grayscale(100%)',
              }}
            />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
