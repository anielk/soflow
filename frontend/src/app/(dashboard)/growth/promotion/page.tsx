'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Plus, TrendingUp, Users, ExternalLink, ToggleRight } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface Platform {
  id:       string;
  name:     string;
  handle:   string;
  enabled:  boolean;
  clicks:   number;
  converts: number;
  followers: number;
  lastPost?: string;
}

const INIT_PLATFORMS: Platform[] = [
  { id: 'reddit',    name: 'Reddit',     handle: 'u/emmarose_official', enabled: true,  clicks: 2340, converts: 187, followers: 4200, lastPost: '2026-06-26T12:00:00Z' },
  { id: 'twitter',   name: 'Twitter/X',  handle: '@emmarose',           enabled: true,  clicks: 1890, converts: 124, followers: 8700, lastPost: '2026-06-27T18:00:00Z' },
  { id: 'tiktok',    name: 'TikTok',     handle: '@emmarose_life',      enabled: false, clicks: 0,    converts: 0,   followers: 12400 },
  { id: 'instagram', name: 'Instagram',  handle: '@emmarose',           enabled: true,  clicks: 980,  converts: 67,  followers: 6300, lastPost: '2026-06-25T10:00:00Z' },
  { id: 'telegram',  name: 'Telegram',   handle: 't.me/emmarose_vip',   enabled: false, clicks: 0,    converts: 0,   followers: 890  },
];

export default function ProfilePromotionPage() {
  const router   = useRouter();
  const [platforms, setPlatforms] = useState(INIT_PLATFORMS);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function togglePlatform(id: string) {
    setPlatforms((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }

  const totalClicks   = platforms.reduce((a, p) => a + p.clicks,   0);
  const totalConverts = platforms.reduce((a, p) => a + p.converts, 0);
  const enabledCount  = platforms.filter((p) => p.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Profile Promotion</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage and track cross-platform promotional activity
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          Add promotion
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active platforms', value: String(enabledCount),       icon: ToggleRight, color: '#8B5CF6' },
          { label: 'Link clicks',      value: formatNumber(totalClicks),   icon: TrendingUp,  color: '#3B82F6' },
          { label: 'Conversions',      value: formatNumber(totalConverts), icon: Users,       color: '#10B981' },
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

      {/* Platforms */}
      <div className="space-y-3">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={[
              'bg-bg-surface border rounded-xl p-5 transition-colors',
              p.enabled ? 'border-bg-border/60' : 'border-bg-border/40 opacity-60',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-subtle border border-bg-border/60 flex items-center justify-center">
                  <span className="text-sm font-bold text-text-secondary">{p.name[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{p.name}</p>
                    <Badge variant={p.enabled ? 'success' : 'default'} size="sm">
                      {p.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <code className="text-xs text-text-muted">{p.handle}</code>
                    <ExternalLink size={10} className="text-text-disabled" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {p.enabled && (
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-base font-bold text-text-primary tabular-nums">{formatNumber(p.followers)}</p>
                      <p className="text-[11px] text-text-muted">followers</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary tabular-nums">{formatNumber(p.clicks)}</p>
                      <p className="text-[11px] text-text-muted">clicks</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-success-text tabular-nums">{formatNumber(p.converts)}</p>
                      <p className="text-[11px] text-text-muted">converts</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary tabular-nums">
                        {p.clicks > 0 ? `${Math.round((p.converts / p.clicks) * 100)}%` : '—'}
                      </p>
                      <p className="text-[11px] text-text-muted">conv. rate</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={[
                    'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 shrink-0',
                    p.enabled ? 'bg-violet-600' : 'bg-bg-overlay',
                  ].join(' ')}
                >
                  <span className={[
                    'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mt-[3px]',
                    p.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
                  ].join(' ')} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
