'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  function toggle() {
    setCollapsed((v) => !v);
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar collapsed={collapsed} />

      <div
        className={[
          'flex flex-col flex-1 min-w-0 transition-all duration-200',
          collapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar',
        ].join(' ')}
      >
        <Topbar onMenuToggle={toggle} collapsed={collapsed} />

        <main className="flex-1 overflow-y-auto mt-topbar">
          <div className="p-6 max-w-[1440px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
