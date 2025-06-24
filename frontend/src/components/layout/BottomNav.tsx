import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';

export default function BottomNav() {


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
