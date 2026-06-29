'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Plus, Copy, BarChart3, Link2, Users, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface TrackingLink {
  id:          string;
  name:        string;
  shortUrl:    string;
  source:      string;
  medium:      string;
  campaign:    string;
  clicks:      number;
  conversions: number;
  revenue:     number;
  status:      'active' | 'paused' | 'archived';
  createdAt:   string;
}

const MOCK_LINKS: TrackingLink[] = [
  { id: 'tk1', name: 'Twitter paid campaign',  shortUrl: 'leinaflow.link/tw-paid',   source: 'twitter',   medium: 'paid_social', campaign: 'june_promo', clicks: 2340, conversions: 87, revenue: 1740, status: 'active',   createdAt: '2026-06-01T00:00:00Z' },
  { id: 'tk2', name: 'Reddit organic',          shortUrl: 'leinaflow.link/reddit-org', source: 'reddit',    medium: 'organic',     campaign: 'evergreen',  clicks: 1890, conversions: 64, revenue: 1280, status: 'active',   createdAt: '2026-05-15T00:00:00Z' },
  { id: 'tk3', name: 'Email newsletter',        shortUrl: 'leinaflow.link/email-nl',   source: 'email',     medium: 'newsletter',  campaign: 'weekly',     clicks: 780,  conversions: 43, revenue: 860,  status: 'active',   createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tk4', name: 'Instagram story swipe-up', shortUrl: 'leinaflow.link/ig-story', source: 'instagram', medium: 'stories',     campaign: 'june_promo', clicks: 560,  conversions: 28, revenue: 560,  status: 'active',   createdAt: '2026-06-12T00:00:00Z' },
  { id: 'tk5', name: 'TikTok bio link',          shortUrl: 'leinaflow.link/tiktok-bio', source: 'tiktok',   medium: 'organic',     campaign: 'bio',        clicks: 234,  conversions: 12, revenue: 240,  status: 'paused',   createdAt: '2026-06-20T00:00:00Z' },
  { id: 'tk6', name: 'YouTube description',      shortUrl: 'leinaflow.link/yt-desc',   source: 'youtube',  medium: 'video',       campaign: 'evergreen',  clicks: 89,   conversions: 5,  revenue: 100,  status: 'archived', createdAt: '2026-03-01T00:00:00Z' },
];

const STATUS_CONFIG: Record<TrackingLink['status'], { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active:   { variant: 'success', label: 'Active'   },
  paused:   { variant: 'warning', label: 'Paused'   },
  archived: { variant: 'default', label: 'Archived' },
};

export default function TrackingLinksPage() {
  const router  = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalClicks = MOCK_LINKS.reduce((a, l) => a + l.clicks, 0);
  const totalConversions = MOCK_LINKS.reduce((a, l) => a + l.conversions, 0);
  const totalRevenue = MOCK_LINKS.reduce((a, l) => a + l.revenue, 0);
  const avgConvRate = Math.round((totalConversions / totalClicks) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Tracking Links</h1>
          <p className="mt-1 text-sm text-text-muted">
            UTM-tagged links to measure which channels drive the most subscribers
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          Create link
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total clicks',   value: formatNumber(totalClicks),       icon: Link2,     color: '#8B5CF6' },
          { label: 'Conversions',    value: formatNumber(totalConversions),   icon: Users,     color: '#10B981' },
          { label: 'Avg conv. rate', value: `${avgConvRate}%`,               icon: BarChart3, color: '#3B82F6' },
          { label: 'Revenue',        value: formatCurrency(totalRevenue),     icon: TrendingUp, color: '#F59E0B' },
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
                {['Name', 'Short URL', 'Source', 'Medium', 'Clicks', 'Conv.', 'Revenue', 'Status', ''].map((col) => (
                  <th key={col} className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/40">
              {MOCK_LINKS.map((link) => {
                const { variant, label } = STATUS_CONFIG[link.status];
                return (
                  <tr key={link.id} className="hover:bg-bg-subtle/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{link.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-violet-400">{link.shortUrl}</code>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs capitalize">{link.source}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{link.medium.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{formatNumber(link.clicks)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-text-secondary tabular-nums">{link.conversions}</span>
                        {link.clicks > 0 && (
                          <span className="ml-1 text-xs text-text-muted">
                            ({Math.round((link.conversions / link.clicks) * 100)}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">
                      {link.revenue > 0 ? formatCurrency(link.revenue) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copyLink(link.shortUrl, link.id)}
                        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors"
                      >
                        <Copy size={11} />
                        {copied === link.id ? 'Copied!' : 'Copy'}
                      </button>
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
