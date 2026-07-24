'use client';

import { ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function AdminLogsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Logs</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform-wide system log stream</p>
      </div>

      {/*
        This page previously had a "Refresh" button and level filter buttons
        that looked functional but did nothing — no log stream was ever wired
        up here. The real, working audit/activity log viewer already exists
        at System → Audit / Activity (real Prisma-backed data, SUPER_ADMIN
        gated), so this page now honestly points there instead of
        duplicating it with fake interactivity.
      */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={ScrollText}
          title="Not implemented as a separate log stream"
          description="Audit and activity logs are real and available under System — this page is not a second, live log viewer."
          action={{ label: 'Go to System → Audit / Activity', href: '/admin/system' }}
        />
      </div>
    </div>
  );
}
