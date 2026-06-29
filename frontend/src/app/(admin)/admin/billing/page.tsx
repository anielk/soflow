'use client';

import { Receipt, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

const STAT_CARDS = [
  { label: 'MRR',         value: '$0',  icon: TrendingUp,  color: '#10B981' },
  { label: 'ARR',         value: '$0',  icon: DollarSign,  color: '#8B5CF6' },
  { label: 'Outstanding', value: '$0',  icon: AlertCircle, color: '#F59E0B' },
  { label: 'Refunds',     value: '$0',  icon: Receipt,     color: '#EF4444' },
];

export default function AdminBillingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Billing</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform-wide revenue and payment overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">{label}</p>
            </div>
            <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Payment history</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Receipt size={32} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No payment records</p>
          <p className="text-xs text-text-muted">Connect a payment processor (Stripe) to see billing history.</p>
        </div>
      </div>
    </div>
  );
}
