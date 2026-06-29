export type PostType        = 'free' | 'ppv';
export type PostStatus      = 'published' | 'scheduled' | 'draft' | 'failed';
export type MediaType       = 'image' | 'video';
export type NotifType       = 'like' | 'tip' | 'subscription' | 'renewal' | 'comment' | 'ppv_unlock';
export type StatementStatus = 'paid' | 'pending' | 'processing';

export interface Post {
  id:           string;
  title:        string;
  caption:      string;
  type:         PostType;
  status:       PostStatus;
  price?:       number;
  scheduledAt?: string;
  publishedAt?: string;
  likes:        number;
  views:        number;
  comments:     number;
  earnings:     number;
  mediaCount:   number;
  mediaType:    MediaType;
}

export interface MediaItem {
  id:         string;
  type:       MediaType;
  filename:   string;
  sizeBytes:  number;
  uploadedAt: string;
}

/** @deprecated alias kept so old VaultItem references still resolve */
export type VaultItem = MediaItem;

export interface Notification {
  id:        string;
  type:      NotifType;
  fanName:   string;
  content:   string;
  amount?:   number;
  timestamp: string;
  read:      boolean;
}

/** @deprecated alias kept for backward compat */
export type OFNotification = Notification;

export interface Collection {
  id:          string;
  name:        string;
  description: string;
  mediaCount:  number;
  price?:      number;
  createdAt:   string;
}

export interface Statement {
  id:          string;
  period:      string;
  periodStart: string;
  gross:       number;
  platformFee: number;
  net:         number;
  status:      StatementStatus;
}
