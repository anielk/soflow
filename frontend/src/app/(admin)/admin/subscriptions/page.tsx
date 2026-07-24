'use client';

import { CreditCard, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { CloudivoPlannedNotice } from '@/components/admin/CloudivoPlannedNotice';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    color: '#6B7280',
    features: ['1 workspace', '1 creator', 'Basic analytics', 'Community support'],
  },
  {
    name: 'Starter',
    price: '$49',
    color: '#3B82F6',
    features: ['1 workspace', '5 creators', 'Full analytics', '3 employees', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$149',
    color: '#8B5CF6',
    features: ['3 workspaces', '25 creators', 'AI Copilot', 'Unlimited employees', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    color: '#F59E0B',
    features: ['Unlimited workspaces', 'Unlimited creators', 'Custom AI', 'SLA', 'Dedicated support'],
  },
];

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Subscriptions</h1>
        <p className="text-sm text-text-muted mt-0.5">Platform subscription plans and active subscriptions</p>
      </div>

      <CloudivoPlannedNotice
        feature="Subscription management"
        description="Billing and subscription management is shared Cloudivo platform functionality. The plan tiers below are illustrative — no plan enforcement, upgrades, or billing exist yet."
      />

      {/* Plan overview — illustrative only, not enforced anywhere */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div key={plan.name} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-text-primary">{plan.name}</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: plan.color }}>{plan.price}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                  <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: plan.color }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Active subscriptions</h2>
        </div>
        <EmptyState
          icon={CreditCard}
          title="Not implemented yet"
          description="Every workspace is on the free plan by default (Workspace.plan) — there is no billing system to change that yet."
        />
      </div>
    </div>
  );
}
