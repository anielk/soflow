'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, LogOut, ExternalLink } from 'lucide-react';
import { adminNavItems } from '@/lib/admin-nav-config';
import { logout } from '@/lib/auth';

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-bg-surface border-r border-bg-border z-30">
      {/* Header */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-bg-border/60 shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
        >
          <ShieldAlert size={13} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-text-primary tracking-tight leading-none">Platform Admin</p>
          <p className="text-[10px] text-text-disabled mt-0.5 tracking-wide uppercase">Leinaflow</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {adminNavItems.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={[
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150 mb-0.5 group',
                active
                  ? 'bg-red-600/15 text-red-400 font-medium'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle',
              ].join(' ')}
            >
              <Icon
                size={15}
                className={active ? 'text-red-400' : 'text-text-disabled group-hover:text-text-muted'}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-bg-border/60 p-3 shrink-0 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-bg-subtle transition-colors"
        >
          <ExternalLink size={12} />
          Back to dashboard
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-muted hover:text-danger-text hover:bg-danger-subtle transition-colors"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
