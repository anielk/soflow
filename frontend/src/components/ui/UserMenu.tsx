'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, Settings, ShieldAlert, LogOut, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { isSuperAdmin, logout } from '@/lib/auth';

type Placement = 'top-right' | 'bottom-left';

interface UserMenuProps {
  variant?: 'compact' | 'expanded';
  placement?: Placement;
}

export function UserMenu({ variant = 'compact', placement = 'top-right' }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuperAdmin(isSuperAdmin());
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const positionClass = placement === 'top-right'
    ? 'top-full right-0 mt-2'
    : 'bottom-full left-0 mb-2';

  const dropdown = open ? (
    <div className={`absolute ${positionClass} w-52 bg-bg-overlay border border-bg-border rounded-xl shadow-xl py-1.5 z-50`}>
      <div className="px-3 py-2 border-b border-bg-border/60 mb-1">
        <p className="text-xs font-semibold text-text-primary">My Account</p>
        <p className="text-[11px] text-text-muted">leinaflow.com</p>
      </div>

      <Link
        href="/settings"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
      >
        <User size={13} />
        My Profile
      </Link>
      <Link
        href="/settings"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
      >
        <Settings size={13} />
        Workspace Settings
      </Link>

      {superAdmin && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors"
        >
          <ShieldAlert size={13} />
          Platform Admin
        </Link>
      )}

      <div className="h-px bg-bg-border/60 my-1" />

      <button
        type="button"
        onClick={() => { setOpen(false); logout(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  ) : null;

  if (variant === 'compact') {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
          aria-label="User menu"
        >
          <Avatar name="User" size="sm" />
        </button>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60 cursor-pointer"
      >
        <Avatar name="User" size="sm" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-text-primary truncate leading-none mb-0.5">My Account</p>
          <p className="text-xs text-text-muted truncate">leinaflow.com</p>
        </div>
        <ChevronDown
          size={13}
          className={['text-text-disabled transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>
      {dropdown}
    </div>
  );
}
