'use client';

import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Customers</h1>
        <p className="text-sm text-text-muted mt-0.5">Organisations and agencies using Leinaflow</p>
      </div>

      <CloudivoPlannedNotice feature="Customer management" />

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <EmptyState
          icon={Building2}
          title="Not implemented yet"
          description="Customer management is planned as shared Cloudivo platform functionality — no customer data is tracked here."
        />
      </div>
    </div>
  );
}
