export type PostType       = 'free' | 'ppv';
export type PostStatus     = 'published' | 'scheduled' | 'draft' | 'failed';
export type MediaType      = 'image' | 'video';
export type NotifType      = 'like' | 'tip' | 'subscription' | 'renewal' | 'comment' | 'ppv_unlock';
export type StatementStatus = 'paid' | 'pending' | 'processing';

export interface Post {
  id:          string;
  title:       string;
  caption:     string;
  type:        PostType;
  status:      PostStatus;
  price?:      number;
  scheduledAt?: string; // ISO
  publishedAt?: string; // ISO
  likes:       number;
  views:       number;
  comments:    number;
  earnings:    number;
  mediaCount:  number;
  mediaType:   MediaType;
}

export interface VaultItem {
  id:         string;
  type:       MediaType;
  filename:   string;
  sizeBytes:  number;
  uploadedAt: string; // ISO
}

export interface OFNotification {
  id:        string;
  type:      NotifType;
  fanName:   string;
  content:   string;
  amount?:   number;
  timestamp: string; // ISO
  read:      boolean;
}

export interface Collection {
  id:          string;
  name:        string;
  description: string;
  mediaCount:  number;
  price?:      number;
  createdAt:   string; // ISO
}

export interface Statement {
  id:          string;
  period:      string; // 'January 2026'
  periodStart: string; // ISO (YYYY-MM-DD)
  gross:       number;
  platformFee: number;
  net:         number;
  status:      StatementStatus;
}
