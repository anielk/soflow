export type CreatorStatus = 'active' | 'paused' | 'inactive';

export interface Creator {
  id:                string;
  username:          string;
  displayName:       string;
  status:            CreatorStatus;
  bio:               string;
  avatarUrl?:        string;
  subscriptionPrice: number;
  subscribers:       number;
  subscribersDelta:  number;  // +/- vs previous period
  revenueMonth:      number;
  revenueTotal:      number;
  postsThisMonth:    number;
  lastPostAt?:       string;  // ISO
  joinedAt:          string;  // ISO
  assignedEmployees: string[]; // employee IDs
  proxyEnabled:      boolean;
  proxyHost?:        string;
  proxyPort?:        number;
  proxyLastVerified?: string; // ISO
}
