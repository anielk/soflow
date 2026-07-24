'use client';

import { ToggleLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

export default function AdminFeatureFlagsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Feature Flags</h1>
        <p className="text-sm text-text-muted mt-0.5">Control feature availability per workspace or globally</p>
      </div>

      <CloudivoPlannedNotice
        feature="Feature flags"
        description="A feature-flag system is shared Cloudivo platform functionality. There is no FeatureFlag data model in Leinaflow today — nothing here reflects a real, toggleable flag."
      />

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={ToggleLeft}
          title="Not implemented yet"
          description="No flags are defined or enforced anywhere in the app."
        />
      </div>
    </div>
  );
}
