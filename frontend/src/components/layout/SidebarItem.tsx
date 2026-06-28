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
        'relative flex items-center rounded transition-colors duration-150 select-none group',
        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
        indent && !collapsed ? 'pl-8' : '',
        active
          ? 'bg-violet-600/10 text-violet-400'
          : 'text-text-muted hover:bg-bg-subtle hover:text-text-primary',
      ].join(' ')}
      title={collapsed ? label : undefined}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && (
        <span className="text-sm truncate flex-1">{label}</span>
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
