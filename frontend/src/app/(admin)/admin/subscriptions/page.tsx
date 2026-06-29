'use client';

import { CreditCard, CheckCircle2 } from 'lucide-react';

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

      {/* Plan overview */}
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

      {/* Active subscriptions table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl">
        <div className="border-b border-bg-border/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Active subscriptions</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CreditCard size={32} className="text-text-disabled" strokeWidth={1.2} />
          <p className="text-sm font-medium text-text-secondary">No active subscriptions</p>
          <p className="text-xs text-text-muted">Subscriptions will appear here once billing is configured.</p>
        </div>
      </div>
    </div>
  );
}
