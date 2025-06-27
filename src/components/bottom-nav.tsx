
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const SnapIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M2.003 11.43c0 2.93 1.21 5.58 3.19 7.45.1.1.25.12.35 0l1.83-1.83c.1-.1.1-.25 0-.35a6.4 6.4 0 01-.98-3.04c0-3.53 2.8-6.4 6.3-6.4s6.3 2.87 6.3 6.4c0 1.25-.36 2.4-.98 3.34-.1.1-.1.25 0 .35l1.83 1.83c.1.1.25.1.35 0 1.98-1.87 3.19-4.52 3.19-7.45 0-5.3-4.2-9.6-9.4-9.6s-9.4 4.3-9.4 9.6z" />
  </svg>
);

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/create', icon: Plus, label: 'Create' },
  { href: '/snap', icon: SnapIcon, label: 'Snap' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="h-16 bg-background border-t border-border z-50 shrink-0">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.href === '/create') {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-3"
              >
                <div className="h-12 w-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all duration-300 transform hover:scale-105">
                  <item.icon className="h-8 w-8" />
                </div>
              </Link>
            );
          }

          const isActive =
            (item.href === '/' && pathname === '/') ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-16 group"
            >
              <item.icon
                className={cn(
                  'h-6 w-6 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  'group-hover:text-primary/80'
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
