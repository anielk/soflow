'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell, Search } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import { navConfig } from '@/lib/nav-config';

interface TopbarProps {
  onMenuToggle: () => void;
  collapsed:    boolean;
}

function resolveTitle(pathname: string): string {
  for (const entry of navConfig) {
    if (entry.kind === 'item' && pathname === entry.href) return entry.label;
    if (entry.kind === 'group') {
      for (const item of entry.items) {
        if (pathname.startsWith(item.href) && item.href !== '/') return item.label;
      }
    }
  }
  return 'Dashboard';
}

export function Topbar({ onMenuToggle, collapsed }: TopbarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header
      className={[
        'fixed top-0 right-0 h-topbar bg-bg-surface border-b border-bg-border z-20',
        'flex items-center gap-3 px-4 transition-all duration-200',
        collapsed ? 'left-sidebar-collapsed' : 'left-sidebar',
      ].join(' ')}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuToggle}
        className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-subtle"
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search stub */}
      <button className="hidden sm:flex items-center gap-2 h-7 px-3 rounded bg-bg-subtle border border-bg-border text-text-muted text-xs hover:border-bg-muted transition-colors">
        <Search size={12} />
        <span>Search...</span>
        <span className="ml-2 text-2xs bg-bg-overlay border border-bg-border rounded px-1 py-0.5 font-mono">⌘K</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors">
          <Bell size={16} />
        </button>
        <Badge variant="violet" size="sm" className="absolute -top-0.5 -right-0.5 pointer-events-none">
          3
        </Badge>
      </div>

      {/* User avatar */}
      <Avatar name="User" size="sm" />
    </header>
  );
}
