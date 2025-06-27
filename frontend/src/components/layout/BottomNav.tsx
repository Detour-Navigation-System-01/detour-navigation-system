'use client';
import Link from 'next/link';
import Image from 'next/image';
import './BottomNav.css';
import { useEffect,useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/auth';


interface User{
  id: number;
  username: string;
}

export default function BottomNav() {

  const pathname = usePathname();
  const [user,setUser] = useState<User |null>(null);

  useEffect(()=>{
    const getUser = async()=>{
      try{
        const res = await fetchCurrentUser();
        if(res?.data?.user){
          setUser(res.data.user);
        }
      }catch(e){
        console.warn('ユーザ情報取得失敗',e);
      }
    };
    getUser();
  },[]);

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
