'use client';

import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

export default function AdminBillingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Billing</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform-wide revenue and payment overview</p>
      </div>

      <CloudivoPlannedNotice feature="Billing" />

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Payment history</h2>
        </div>
        <EmptyState
          icon={Receipt}
          title="Not implemented yet"
          description="No payment processor is connected — there is no revenue, invoice, or refund data to show."
        />
      </div>
    </div>
  );
}
