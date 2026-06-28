export type Period = 'yesterday' | 'today' | 'this_week' | 'this_month';

export interface RevenueBreakdown {
  subscriptions: number;
  tips:          number;
  ppv:           number;
  messages:      number;
  streams:       number;
  referrals:     number;
}

export interface DashboardStats {
  totalRevenue:       number;
  totalRevenueChange: number; // percentage vs previous period
  breakdown:          RevenueBreakdown;
  subscribers:        number;
  subscribersChange:  number;
  posts:              number;
  totalViews:         number;
  engagementRate:     number;
}

export interface ChartDataPoint {
  date:          string; // YYYY-MM-DD
  revenue:       number;
  subscriptions: number;
  tips:          number;
  ppv:           number;
}

export type ActivityType =
  | 'new_subscriber'
  | 'tip'
  | 'ppv_purchase'
  | 'message'
  | 'renewal'
  | 'post_scheduled';

export interface ActivityItem {
  id:           string;
  type:         ActivityType;
  fanName:      string;
  fanAvatarUrl?: string;
  amount?:      number;
  timestamp:    string; // ISO string
  meta?:        string;
}

export interface ScheduledPost {
  id:           string;
  title:        string;
  scheduledAt:  string; // ISO string
  type:         'free' | 'ppv';
  price?:       number;
  thumbnailUrl?: string;
}

export interface CreatorGoal {
  label:   string;
  current: number;
  target:  number;
  unit:    string;
}
