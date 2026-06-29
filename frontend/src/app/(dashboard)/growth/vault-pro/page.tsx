'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge } from '@/components/ui';
import { Lock, DollarSign, Eye, BarChart3, Zap, Star } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface VaultItem {
  id:        string;
  filename:  string;
  type:      'image' | 'video';
  price:     number;
  unlocks:   number;
  views:     number;
  revenue:   number;
  uploadedAt: string;
}

const MOCK_VAULT: VaultItem[] = [
  { id: 'v1', filename: 'exclusive-bts-shoot.mp4', type: 'video', price: 24.99, unlocks: 210, views: 840, revenue: 4240, uploadedAt: '2026-06-10T00:00:00Z' },
  { id: 'v2', filename: 'photoshoot-collection.zip', type: 'image', price: 14.99, unlocks: 312, views: 1240, revenue: 3820, uploadedAt: '2026-06-01T00:00:00Z' },
  { id: 'v3', filename: 'workout-routine.mp4', type: 'video', price: 9.99, unlocks: 189, views: 720, revenue: 1650, uploadedAt: '2026-05-20T00:00:00Z' },
  { id: 'v4', filename: 'behind-the-scenes.mp4', type: 'video', price: 19.99, unlocks: 78, views: 310, revenue: 1240, uploadedAt: '2026-05-10T00:00:00Z' },
];

const totalRevenue = MOCK_VAULT.reduce((a, v) => a + v.revenue, 0);
const totalUnlocks = MOCK_VAULT.reduce((a, v) => a + v.unlocks, 0);
const totalViews   = MOCK_VAULT.reduce((a, v) => a + v.views, 0);

export default function VaultProPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-text-primary">Vault Pro</h1>
          <Badge variant="violet" size="sm">Pro</Badge>
        </div>
      </div>

      <p className="text-sm text-text-muted -mt-2">
        Enhanced vault analytics — see exactly which locked content earns the most
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Vault revenue',    value: formatCurrency(totalRevenue), icon: DollarSign, color: '#10B981' },
          { label: 'Total unlocks',    value: formatNumber(totalUnlocks),   icon: Lock,       color: '#8B5CF6' },
          { label: 'Total views',      value: formatNumber(totalViews),     icon: Eye,        color: '#3B82F6' },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Pro features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BarChart3, label: 'Per-item analytics', desc: 'See views, unlocks and revenue for each vault item individually.' },
          { icon: Zap,       label: 'Price optimization', desc: 'AI-powered suggestions for the optimal price per item based on historical data.' },
          { icon: Star,      label: 'Featured items',     desc: 'Pin your best-performing items to the top of your vault for discovery.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-violet-600/10 flex items-center justify-center mb-3">
              <Icon size={16} className="text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">{label}</p>
            <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Vault content table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
          <h2 className="text-sm font-semibold text-text-primary">Vault content analytics</h2>
          <p className="text-xs text-text-muted mt-0.5">Sorted by revenue generated</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Content', 'Type', 'Price', 'Views', 'Unlocks', 'Conv. rate', 'Revenue'].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {MOCK_VAULT.sort((a, b) => b.revenue - a.revenue).map((item) => (
                <tr key={item.id} className="hover:bg-bg-subtle/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-bg-subtle border border-bg-border/40 flex items-center justify-center shrink-0">
                        <Lock size={12} className="text-text-muted" />
                      </div>
                      <span className="text-text-secondary font-mono text-xs truncate max-w-[160px]">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default" size="sm">{item.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">€{item.price}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(item.views)}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(item.unlocks)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className={item.unlocks / item.views > 0.3 ? 'text-success-text' : 'text-text-secondary'}>
                      {Math.round((item.unlocks / item.views) * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
