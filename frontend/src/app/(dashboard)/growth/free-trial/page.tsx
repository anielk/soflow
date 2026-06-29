'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Plus, Copy, Link2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface TrialLink {
  id:          string;
  name:        string;
  code:        string;
  trialDays:   number;
  clicks:      number;
  conversions: number;
  revenue:     number;
  expiresAt?:  string;
  status:      'active' | 'expired' | 'paused';
  createdAt:   string;
}

const MOCK_LINKS: TrialLink[] = [
  { id: 'tl1', name: 'Reddit r/fitness promo',  code: 'REDDIT-FIT',   trialDays: 7,  clicks: 892,  conversions: 67, revenue: 1340, status: 'active',  expiresAt: '2026-07-31T00:00:00Z', createdAt: '2026-06-01T00:00:00Z' },
  { id: 'tl2', name: 'Twitter bio link',         code: 'TWITTER-BIO',  trialDays: 7,  clicks: 634,  conversions: 42, revenue: 840,  status: 'active',  createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tl3', name: 'Instagram story April',    code: 'IG-APR26',     trialDays: 3,  clicks: 312,  conversions: 29, revenue: 580,  status: 'expired', expiresAt: '2026-04-30T00:00:00Z', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'tl4', name: 'S4S with FitByNature',     code: 'S4S-FIT',      trialDays: 14, clicks: 189,  conversions: 18, revenue: 360,  status: 'active',  createdAt: '2026-06-15T00:00:00Z' },
  { id: 'tl5', name: 'TikTok June campaign',     code: 'TIKTOK-JUN',   trialDays: 7,  clicks: 0,    conversions: 0,  revenue: 0,    status: 'paused',  createdAt: '2026-06-20T00:00:00Z' },
];

const STATUS_CONFIG: Record<TrialLink['status'], { variant: 'success' | 'default' | 'danger' | 'warning'; label: string }> = {
  active:  { variant: 'success', label: 'Active'  },
  expired: { variant: 'danger',  label: 'Expired' },
  paused:  { variant: 'warning', label: 'Paused'  },
};

export default function FreeTrialLinksPage() {
  const router  = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function copyLink(code: string) {
    navigator.clipboard.writeText(`https://onlyfans.com/action/trial/${code.toLowerCase()}`).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalClicks = MOCK_LINKS.reduce((a, l) => a + l.clicks, 0);
  const totalConversions = MOCK_LINKS.reduce((a, l) => a + l.conversions, 0);
  const totalRevenue = MOCK_LINKS.reduce((a, l) => a + l.revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Free Trial Links</h1>
          <p className="mt-1 text-sm text-text-muted">
            Generate and track free trial subscription links for each campaign
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          Create link
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total clicks',   value: formatNumber(totalClicks),       icon: Link2,       color: '#8B5CF6' },
          { label: 'Conversions',    value: formatNumber(totalConversions),   icon: Users,       color: '#10B981' },
          { label: 'Revenue earned', value: formatCurrency(totalRevenue),     icon: DollarSign,  color: '#3B82F6' },
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

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Name', 'Code', 'Trial', 'Clicks', 'Conversions', 'Conv. %', 'Revenue', 'Status', ''].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {MOCK_LINKS.map((link) => {
                const { variant, label } = STATUS_CONFIG[link.status];
                const convPct = link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 100) : 0;
                return (
                  <tr key={link.id} className="hover:bg-bg-subtle/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{link.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-text-secondary bg-bg-subtle px-2 py-0.5 rounded">
                        {link.code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs tabular-nums">{link.trialDays} days</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(link.clicks)}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{link.conversions}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={convPct >= 8 ? 'text-success-text' : 'text-text-secondary'}>
                        {link.clicks > 0 ? `${convPct}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                      {link.revenue > 0 ? formatCurrency(link.revenue) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(link.code)}
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors"
                        >
                          <Copy size={11} />
                          {copied === link.code ? 'Copied!' : 'Copy'}
                        </button>
                        <button type="button" className="text-xs text-text-muted hover:text-violet-400 transition-colors">
                          <TrendingUp size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
