import type {
  DashboardStats,
  ChartDataPoint,
  ActivityItem,
  ScheduledPost,
  CreatorGoal,
} from '@/types/dashboard';

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

// ---------------------------------------------------------------------------
// Revenue chart — 30 days of realistic data with a natural curve
// ---------------------------------------------------------------------------
function buildChartData(): ChartDataPoint[] {
  const seed = [
    2800, 3100, 2950, 3400, 3200, 2700, 2600,
    3500, 3800, 4200, 3900, 3600, 3300, 2900,
    2750, 2800, 2650, 2700, 2720, 2680, 2710,
    2690, 2700, 2720, 2700, 2690, 2710, 2700,
    2680, 2720,
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return seed.map((revenue, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return {
      date:          d.toISOString().split('T')[0],
      revenue,
      subscriptions: Math.round(revenue * 0.53),
      tips:          Math.round(revenue * 0.19),
      ppv:           Math.round(revenue * 0.15),
    };
  });
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalRevenue:       18_420,
  totalRevenueChange: 12.4,
  breakdown: {
    subscriptions: 9_840,
    tips:          3_210,
    ppv:           2_870,
    messages:      1_450,
    streams:         680,
    referrals:       370,
  },
  subscribers:        1_247,
  subscribersChange:  8.2,
  posts:              43,
  totalViews:         89_430,
  engagementRate:     6.8,
};

export const MOCK_CHART_DATA: ChartDataPoint[] = buildChartData();

// ---------------------------------------------------------------------------
// Activity feed — relative to "now" at module evaluation time is fine for mock
// ---------------------------------------------------------------------------
function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'new_subscriber', fanName: 'Mike R.',   amount: 14.99, timestamp: ago(4)    },
  { id: '2', type: 'tip',            fanName: 'Jake D.',   amount: 50,    timestamp: ago(12)   },
  { id: '3', type: 'ppv_purchase',   fanName: 'Chris M.',  amount: 25,    timestamp: ago(28)   },
  { id: '4', type: 'renewal',        fanName: 'Tom B.',    amount: 14.99, timestamp: ago(45)   },
  { id: '5', type: 'message',        fanName: 'Dan K.',    amount: 10,    timestamp: ago(67)   },
  { id: '6', type: 'tip',            fanName: 'Alex W.',   amount: 100,   timestamp: ago(120)  },
  { id: '7', type: 'new_subscriber', fanName: 'Ryan P.',   amount: 14.99, timestamp: ago(180)  },
  { id: '8', type: 'ppv_purchase',   fanName: 'Jordan S.', amount: 35,    timestamp: ago(240)  },
];

// ---------------------------------------------------------------------------
// Scheduled posts
// ---------------------------------------------------------------------------
function fromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
  { id: '1', title: 'Morning workout routine',   scheduledAt: fromNow(2),  type: 'free'              },
  { id: '2', title: 'Exclusive photoshoot BTS',  scheduledAt: fromNow(6),  type: 'ppv',  price: 15  },
  { id: '3', title: "Q&A session highlights",    scheduledAt: fromNow(26), type: 'free'              },
  { id: '4', title: 'Behind the scenes vlog',    scheduledAt: fromNow(50), type: 'ppv',  price: 20  },
];

// ---------------------------------------------------------------------------
// Creator goals
// ---------------------------------------------------------------------------
export const MOCK_CREATOR_GOALS: CreatorGoal[] = [
  { label: 'Subscribers',  current: 1_247, target: 1_500, unit: ''  },
  { label: 'Monthly revenue', current: 18_420, target: 25_000, unit: '€' },
];
