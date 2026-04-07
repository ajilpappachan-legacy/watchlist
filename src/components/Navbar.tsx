'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Search, BookMarked } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((data) => setWatchlistCount(data.items?.length ?? 0))
      .catch(() => {});
  }, [pathname]); // refresh count on navigation

  const navLinks = [
    {
      href: '/',
      label: 'Search',
      icon: <Search className="size-4" />,
    },
    {
      href: '/watchlist',
      label: 'Watchlist',
      icon: <BookMarked className="size-4" />,
      badge: watchlistCount,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Clapperboard className="size-5" />
          <span className="hidden sm:inline">Watchlist</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
                {badge != null && badge > 0 && (
                  <Badge className="h-5 min-w-5 px-1 text-xs bg-accent text-accent-foreground">
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
