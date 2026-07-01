'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon:      LucideIcon;
  label:     string;
  href:      string;
  badge?:    number | string;
  active:    boolean;
  indent?:   boolean;
  collapsed?: boolean;
}

export function SidebarItem({ icon: Icon, label, href, badge, active, indent, collapsed }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={[
        'relative flex items-center rounded transition-all duration-150 select-none group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60',
        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
        indent && !collapsed ? 'pl-8' : '',
        active
          ? 'bg-violet-600/[0.12] text-violet-400 font-medium'
          : 'text-text-muted hover:bg-bg-subtle/80 hover:text-text-secondary',
      ].join(' ')}
      title={collapsed ? label : undefined}
    >
      {/* Left accent bar for active item */}
      {active && !collapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] bg-violet-500 rounded-r-full"
          aria-hidden="true"
        />
      )}

      <Icon
        size={15}
        className={[
          'shrink-0 transition-transform duration-150',
          !active ? 'group-hover:translate-x-px' : '',
        ].join(' ')}
      />

      {!collapsed && (
        <span className="text-sm truncate flex-1 leading-none">{label}</span>
      )}

      {!collapsed && badge !== undefined && Number(badge) > 0 && (
        <Badge variant="violet" size="sm">{badge}</Badge>
      )}

      {collapsed && badge !== undefined && Number(badge) > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-600 text-white text-2xs flex items-center justify-center">
          {Number(badge) > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
