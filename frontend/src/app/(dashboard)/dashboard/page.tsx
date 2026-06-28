'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import type { Period } from '@/types/dashboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  PeriodSelector,
  RevenueOverviewCard,
  QuickActionsRow,
  RevenueChart,
  ActivityFeed,
  ScheduledPostsCard,
  CreatorProgressCard,
} from '@/components/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('this_month');
  const { stats, chartData, activity, scheduledPosts, goals, loading } = useDashboardStats(period);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Period selector row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-sm font-semibold text-text-secondary tracking-wide uppercase">
          Overview
        </h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Revenue hero */}
      <RevenueOverviewCard stats={stats} loading={loading} />

      {/* Quick actions */}
      <QuickActionsRow />

      {/* Revenue chart (2/3) + Activity feed (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 min-h-0">
          <RevenueChart data={chartData} loading={loading} />
        </div>
        <div className="min-h-0">
          <ActivityFeed items={activity} loading={loading} />
        </div>
      </div>

      {/* Scheduled posts (1/2) + Creator progress (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ScheduledPostsCard posts={scheduledPosts} loading={loading} />
        <CreatorProgressCard goals={goals} loading={loading} />
      </div>
    </div>
  );
}
