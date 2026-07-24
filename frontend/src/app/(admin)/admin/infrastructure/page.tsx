'use client';

import { Server } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

export default function AdminInfrastructurePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Infrastructure</h1>
        <p className="text-sm text-text-muted mt-0.5">Service status and infrastructure health overview</p>
      </div>

      <CloudivoPlannedNotice
        feature="Infrastructure monitoring"
        description="A dedicated infrastructure/monitoring dashboard is shared Cloudivo platform functionality. This page previously showed fabricated uptime and status values that were never connected to anything real — they've been removed rather than left in place. For an actual, live check of the database, Redis, storage, and SMTP, see System → Health, which really does ping each of those."
      />

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Server}
          title="Not implemented yet"
          description="No infrastructure metrics (uptime, latency, request volume) are collected or displayed here."
          action={{ label: 'Go to System → Health', href: '/admin/system' }}
        />
      </div>
    </div>
  );
}
