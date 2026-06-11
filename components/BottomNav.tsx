'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/home', label: 'Home', icon: '🏛' },
  { href: '/progress', label: 'Progress', icon: '📈' },
  { href: '/course', label: 'Course', icon: '📖' },
  { href: '/insights', label: 'Insights', icon: '🥧' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border bg-panel px-2 py-3">
      <div className="flex justify-around">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
