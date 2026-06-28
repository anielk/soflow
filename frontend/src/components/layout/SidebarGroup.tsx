'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface SidebarGroupProps {
  id:           string;
  label:        string;
  children:     ReactNode;
  defaultOpen?: boolean;
  collapsed?:   boolean;
}

export function SidebarGroup({ id, label, children, defaultOpen = false, collapsed }: SidebarGroupProps) {
  const storageKey = `sf-nav-${id}`;

  const [open, setOpen] = useState<boolean>(() => {
    // SSR-safe: default to defaultOpen, hydrated from localStorage on client
    return defaultOpen;
  });

  // Sync from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setOpen(stored === 'true');
    } catch {}
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  }

  if (collapsed) {
    // Icon-only mode: render children without the group header
    return <div className="flex flex-col gap-0.5">{children}</div>;
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-2.5 h-7 rounded text-2xs font-medium uppercase tracking-wider text-text-disabled hover:text-text-muted transition-colors duration-150 select-none"
      >
        <span>{label}</span>
        <ChevronRight
          size={12}
          className={['shrink-0 transition-transform duration-200', open ? 'rotate-90' : ''].join(' ')}
        />
      </button>
      <div
        className={[
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>
      </div>
    </div>
  );
}
