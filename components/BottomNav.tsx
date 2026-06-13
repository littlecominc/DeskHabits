'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/home', label: 'Today', icon: '🏠' },
  { href: '/course', label: 'Course', icon: '📘' },
  { href: '/progress', label: 'Analytics', icon: '📊' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-btn ${active ? 'active' : ''}`}>
            <span className="ic">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
