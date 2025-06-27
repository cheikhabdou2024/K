'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/create', icon: Plus, label: 'Create' },
  { href: '/snap', icon: Camera, label: 'Snap' },
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
