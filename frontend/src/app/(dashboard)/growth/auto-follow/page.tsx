'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Input, ComingSoonNotice } from '@/components/ui';
import { UserPlus, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/format';

export default function AutoFollowPage() {
  const router = useRouter();
  const [enabled,     setEnabled]     = useState(false);
  const [dailyLimit,  setDailyLimit]  = useState('50');
  const [targetNiche, setTargetNiche] = useState('fitness, lifestyle');
  const [minFans,     setMinFans]     = useState('500');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function handleSave(e: React.FormEvent) {
    // Intentionally does nothing beyond preventing a page reload — there is
    // no backend for auto-follow. This used to show a fake "Settings saved
    // successfully" toast; removed rather than left misleading.
    e.preventDefault();
  }

  const MOCK_STATS = [
    { label: 'Follows today',   value: formatNumber(23),     icon: UserPlus,   color: '#8B5CF6' },
    { label: 'Follows this mo', value: formatNumber(412),    icon: Users,      color: '#3B82F6' },
    { label: 'Conversion rate', value: '4.2%',               icon: TrendingUp, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Auto-follow</h1>
        <p className="mt-1 text-sm text-text-muted">
          Automatically follow creators in your niche to grow your audience organically
        </p>
      </div>

      <ComingSoonNotice feature="Auto-follow" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK_STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
              <p className="mt-0.5 text-base font-bold text-text-primary tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="max-w-xl space-y-6">
        {/* Enable toggle */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Enable auto-follow</p>
              <p className="text-xs text-text-muted mt-0.5">
                {enabled ? 'Auto-follow is active and running' : 'Auto-follow is paused'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((v) => !v)}
              className={[
                'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200',
                enabled ? 'bg-violet-600' : 'bg-bg-overlay',
              ].join(' ')}
            >
              <span className={[
                'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mt-[3px]',
                enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
              ].join(' ')} />
            </button>
          </div>

        </div>

        {/* Config form */}
        <form onSubmit={handleSave} className={['space-y-5', !enabled ? 'opacity-50 pointer-events-none' : ''].join(' ')}>
          <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-4">
            <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em]">
              Follow settings
            </h3>

            <Input
              label="Daily follow limit"
              type="number"
              min="1"
              max="200"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              hint="Platform guidelines recommend staying under 100 follows per day to avoid restrictions."
            />
            <Input
              label="Target niches"
              value={targetNiche}
              onChange={(e) => setTargetNiche(e.target.value)}
              hint="Comma-separated keywords used to find relevant creators."
            />
            <Input
              label="Minimum fan count"
              type="number"
              min="0"
              value={minFans}
              onChange={(e) => setMinFans(e.target.value)}
              hint="Only follow creators with at least this many fans."
            />
          </div>

          {/* Warning */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl px-4 py-3.5 flex items-start gap-3">
            <AlertCircle size={14} className="text-warning-text mt-0.5 shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Keep daily limits below 100 to stay within platform guidelines.
              Excessive automated following may trigger account restrictions.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" disabled>Save settings (not implemented)</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
