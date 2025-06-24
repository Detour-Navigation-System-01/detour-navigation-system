import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';

export default function BottomNav() {
<<<<<<< HEAD
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'map', icon: '/icons/map.png' },
    {
      href: '/preservation',
      label: 'Preservation Spot',
      icon: '/icons/preserve.png',
    },
    { href: '/login', label: 'my profile', icon: '/icons/profile.png' },
  ];

=======
>>>>>>> 8f21bdf0e44a345ddb7a740d92be4f2fa76935e3
  return (
    <nav className="bottom-nav">
      <Link href="/">
        <div className="nav-item">
          <Image src="/icons/map.svg" alt="Map Icon" width={24} height={24} />
          <span>Map</span>
        </div>
      </Link>
      <Link href="/preservation">
        <div className="nav-item">
          <Image
            src="/icons/preserve.svg"
            alt="Preservation Icon"
            width={24}
            height={24}
          />
          <span>Preserve</span>
        </div>
      </Link>
      <Link href="/profile">
        <div className="nav-item">
          <Image
            src="/icons/profile.svg"
            alt="Profile Icon"
            width={24}
            height={24}
          />
          <span>Profile</span>
        </div>
      </Link>
    </nav>
  );
}
