'use client';

import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';
import { navConfig, type NavEntry } from '@/lib/nav-config';
import { UserMenu } from '@/components/ui/UserMenu';
import { LogoIcon } from '@/components/brand/Logo';

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
        <LogoIcon size={28} />
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
        collapsed ? 'p-2 flex flex-col items-center' : 'p-3 space-y-2',
      ].join(' ')}>
        <UserMenu
          variant={collapsed ? 'compact' : 'expanded'}
          placement="bottom-left"
        />
        {!collapsed && (
          <p className="text-[10px] text-text-disabled text-center leading-relaxed">
            Leinaflow &middot; A product of <span className="text-text-muted">Cloudivo</span>
          </p>
        )}
      </div>
    </aside>
  );
}
