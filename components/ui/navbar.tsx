'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavItem = { name: string; href: string };

const navigation: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Owners', href: '/owners' },
  { name: 'Seasons', href: '/seasons' },
  { name: 'Records', href: '/records' },
  { name: 'Rivalries', href: '/rivalries' },
  { name: 'Hall of Fame', href: '/hall-of-fame' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-bg-tertiary bg-bg-secondary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-trophy-gold via-trophy-orange to-trophy-red bg-clip-text text-transparent">
              PFL
            </span>
            <span className="text-sm text-text-secondary hidden sm:block">
              Since 2004
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-primary text-bg-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <MobileMenu navigation={navigation} pathname={pathname} />
        </div>
      </div>
    </nav>
  );
}

function MobileMenu({
  navigation,
  pathname,
}: {
  navigation: NavItem[];
  pathname: string | null;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-bg-secondary border-b border-bg-tertiary z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    isActive
                      ? 'bg-accent-primary text-bg-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
