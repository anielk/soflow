'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut, ChevronDown, Layers } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';
import { navConfig, type NavEntry } from '@/lib/nav-config';
import { logout } from '@/lib/auth';

interface SidebarProps {
  collapsed?: boolean;
}

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  function renderEntry(entry: NavEntry) {
    if (entry.kind === 'divider') {
      return <div key={entry.id} className="h-px bg-bg-border mx-2 my-1" />;
    }

    if (entry.kind === 'item') {
      return (
        <SidebarItem
          key={entry.id}
          icon={entry.icon}
          label={entry.label}
          href={entry.href}
          badge={entry.badge}
          active={isActive(entry.href, pathname)}
          collapsed={collapsed}
        />
      );
    }

    // kind === 'group'
    return (
      <SidebarGroup
        key={entry.id}
        id={entry.id}
        label={entry.label}
        defaultOpen={entry.defaultOpen}
        collapsed={collapsed}
      >
        {entry.items.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            href={item.href}
            badge={item.badge}
            active={isActive(item.href, pathname)}
            indent={!collapsed}
            collapsed={collapsed}
          />
        ))}
      </SidebarGroup>
    );
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-screen flex flex-col bg-bg-surface border-r border-bg-border z-30',
        'transition-all duration-200',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      ].join(' ')}
    >
      {/* Logo + workspace */}
      <div className={[
        'flex items-center border-b border-bg-border/60 shrink-0',
        collapsed ? 'h-14 justify-center px-0' : 'h-14 px-4 gap-3',
      ].join(' ')}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
        >
          <Layers size={13} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <>
            <span className="text-[15px] font-bold text-text-primary tracking-tight">Leinaflow</span>
            <button className="ml-auto p-0.5 rounded text-text-disabled hover:text-text-muted transition-colors">
              <ChevronDown size={13} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col">
        {navConfig.map(renderEntry)}
      </nav>

      {/* User footer */}
      <div className={[
        'border-t border-bg-border/60 shrink-0',
        collapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3',
      ].join(' ')}>
        {collapsed ? (
          <>
            <Avatar name="User" size="sm" />
            <Link href="/settings" className="text-text-muted hover:text-text-primary transition-colors">
              <Settings size={15} />
            </Link>
            <button onClick={logout} className="text-text-muted hover:text-danger-text transition-colors">
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5 group cursor-default">
            <Avatar name="User" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate leading-none mb-0.5">My Account</p>
              <p className="text-xs text-text-muted truncate">leinaflow.com</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <Link
                href="/settings"
                className="p-1.5 rounded text-text-disabled hover:text-text-secondary hover:bg-bg-subtle transition-colors"
              >
                <Settings size={13} />
              </Link>
              <button
                onClick={logout}
                className="p-1.5 rounded text-text-disabled hover:text-danger-text hover:bg-danger-subtle transition-colors"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
