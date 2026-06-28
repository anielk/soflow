'use client';

import { useState, useEffect } from 'react';
import type { Period, DashboardStats, ChartDataPoint, ActivityItem, ScheduledPost, CreatorGoal } from '@/types/dashboard';
import {
  USE_MOCK_DATA,
  MOCK_DASHBOARD_STATS,
  MOCK_CHART_DATA,
  MOCK_ACTIVITY,
  MOCK_SCHEDULED_POSTS,
  MOCK_CREATOR_GOALS,
} from '@/lib/mock-data';
import { apiGet } from '@/lib/api';

export interface DashboardData {
  stats:          DashboardStats | null;
  chartData:      ChartDataPoint[];
  activity:       ActivityItem[];
  scheduledPosts: ScheduledPost[];
  goals:          CreatorGoal[];
  loading:        boolean;
}

// Scale mock stats to feel realistic per period
const PERIOD_STATS: Record<Period, DashboardStats> = {
  today: {
    ...MOCK_DASHBOARD_STATS,
    totalRevenue:       571,
    totalRevenueChange: 4.2,
    breakdown: { subscriptions: 298, tips: 105, ppv: 92, messages: 48, streams: 18, referrals: 10 },
    subscribers:        31,
    subscribersChange:  2.1,
    totalViews:         2_840,
    engagementRate:     7.1,
  },
  yesterday: {
    ...MOCK_DASHBOARD_STATS,
    totalRevenue:       548,
    totalRevenueChange: -2.8,
    breakdown: { subscriptions: 286, tips: 100, ppv: 88, messages: 45, streams: 20, referrals: 9 },
    subscribers:        28,
    subscribersChange:  -1.4,
    totalViews:         2_690,
    engagementRate:     6.5,
  },
  this_week: {
    ...MOCK_DASHBOARD_STATS,
    totalRevenue:       4_230,
    totalRevenueChange: 8.1,
    breakdown: { subscriptions: 2_240, tips: 740, ppv: 660, messages: 335, streams: 155, referrals: 100 },
    subscribers:        224,
    subscribersChange:  5.2,
    totalViews:         20_540,
    engagementRate:     6.9,
  },
  this_month: MOCK_DASHBOARD_STATS,
};

function sliceChartData(data: ChartDataPoint[], period: Period): ChartDataPoint[] {
  if (period === 'today' || period === 'yesterday') return data.slice(-1);
  if (period === 'this_week')  return data.slice(-7);
  return data;
}

export function useDashboardStats(period: Period): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, 'loading'>>({
    stats:          null,
    chartData:      [],
    activity:       [],
    scheduledPosts: [],
    goals:          [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (USE_MOCK_DATA) {
      const timer = setTimeout(() => {
        setData({
          stats:          PERIOD_STATS[period],
          chartData:      sliceChartData(MOCK_CHART_DATA, period),
          activity:       MOCK_ACTIVITY,
          scheduledPosts: MOCK_SCHEDULED_POSTS,
          goals:          MOCK_CREATOR_GOALS,
        });
        setLoading(false);
      }, 280);
      return () => clearTimeout(timer);
    }

    apiGet<DashboardStats>(`/dashboard/stats?period=${period}`)
      .then((stats) => {
        setData({
          stats,
          chartData:      [],
          activity:       [],
          scheduledPosts: [],
          goals:          [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return { ...data, loading };
}
