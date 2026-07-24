'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { EmptyState, Skeleton } from '@/components/ui';
import { QuickActionsRow, OnboardingChecklist } from '@/components/dashboard';
import { UsersRound, UserCheck, Image as ImageIcon, HardDrive, Users, History, TrendingUp } from 'lucide-react';
import { getDashboardStats, listWorkspaceActivity } from '@/lib/workspace';
import { relativeTime } from '@/lib/format';
import type { ActivityLogItem, DashboardStats } from '@/types/workspace';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => undefined)
      .finally(() => setStatsLoading(false));
    listWorkspaceActivity(8)
      .then(setActivity)
      .catch(() => undefined)
      .finally(() => setActivityLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Total creators', value: String(stats.totalCreators), icon: UsersRound, color: '#8B5CF6' },
        { label: 'Active creators', value: String(stats.activeCreators), icon: UserCheck, color: '#10B981' },
        { label: 'Media files', value: String(stats.mediaCount), icon: ImageIcon, color: '#3B82F6' },
        { label: 'Storage used', value: formatBytes(stats.storageBytes), icon: HardDrive, color: '#F59E0B' },
        { label: 'Workspace members', value: String(stats.memberCount), icon: Users, color: '#EC4899' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* First-run onboarding checklist — renders nothing once complete or dismissed. Real, DB-backed. */}
      <OnboardingChecklist />

      {/* Quick actions — real navigation shortcuts, not data. */}
      <QuickActionsRow />

      <div>
        <h3 className="text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] mb-3">
          Workspace overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={68} rounded="lg" />)
          ) : (
            cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
                  <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">{value}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
          </div>
          {activityLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={40} rounded="lg" />)}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="Actions your team takes across the workspace will show up here." size="sm" />
          ) : (
            <ul className="divide-y divide-bg-border/40">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/15 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <History size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{item.message}</p>
                    <p className="text-[11px] text-text-disabled mt-0.5">{relativeTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 flex flex-col items-start gap-2">
          <div className="w-9 h-9 rounded-lg bg-bg-subtle flex items-center justify-center">
            <TrendingUp size={16} className="text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Revenue</h3>
          <p className="text-xs text-text-muted">Revenue integration coming soon.</p>
        </div>
      </div>
    </div>
  );
}
