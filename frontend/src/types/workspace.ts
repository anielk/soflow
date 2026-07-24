export type PostType        = 'free' | 'ppv';
export type PostStatus      = 'published' | 'scheduled' | 'draft' | 'failed';
export type MediaType       = 'image' | 'video' | 'document';
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

export type MediaFileStatus = 'processing' | 'ready' | 'failed';

export interface MediaItem {
  id:               string;
  workspaceId:      string;
  ownerId:          string;
  ownerName:        string;
  creatorId:        string | null;
  filename:         string;
  originalFilename: string;
  mimeType:         string;
  extension:        string;
  sizeBytes:        number;
  width:            number | null;
  height:           number | null;
  duration:         number | null;
  type:             MediaType;
  status:           MediaFileStatus;
  hasThumbnail:     boolean;
  createdAt:        string;
  updatedAt:        string;
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

// ─── Workspace / onboarding ────────────────────────────────────────────────

export interface WorkspaceProfile {
  id:           string;
  name:         string;
  slug:         string;
  plan:         string;
  hasLogo:      boolean;
  locale:       string;
  timezone:     string;
  dateFormat:   string;
  numberFormat: string;
  currency:     string;
  createdAt:    string;
  updatedAt:    string;
}

export interface OnboardingStatus {
  hasLogo:           boolean;
  memberCount:       number;
  hasTeammate:       boolean;
  mediaCount:        number;
  hasMedia:          boolean;
  creatorCount:      number;
  hasCreator:        boolean;
  aiConnectionCount: number;
  hasAiConnection:   boolean;
  allRequiredDone:   boolean;
}

export interface WorkspaceMemberRecord {
  id:       string;
  role:     string;
  joinedAt: string;
  user: {
    id:    string;
    name:  string | null;
    email: string;
  };
}

export interface NewWorkspaceMember extends WorkspaceMemberRecord {
  temporaryPassword: string | null;
  emailSent: boolean;
}

export type CreatorStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface CreatorRecord {
  id:        string;
  name:      string;
  email:     string | null;
  phone:     string | null;
  bio:       string | null;
  notes:     string | null;
  tags:      string[];
  avatarUrl: string | null;
  status:    CreatorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorStats {
  mediaCount:    number;
  imageCount:    number;
  videoCount:    number;
  documentCount: number;
  storageBytes:  number;
}

export interface ActivityLogItem {
  id:         string;
  workspaceId: string | null;
  userId:      string | null;
  actorName:   string | null;
  message:     string;
  category:    string;
  targetType:  string | null;
  targetId:    string | null;
  createdAt:   string;
}

export interface AuditLogItem {
  id:         string;
  workspaceId: string | null;
  userId:      string | null;
  userLabel:   string | null;
  eventType:   string;
  category:    string;
  targetType:  string | null;
  targetId:    string | null;
  metadata:    Record<string, unknown> | null;
  createdAt:   string;
}

export interface LocaleOption {
  value: string;
  label: string;
}

export interface LocaleOptions {
  locales:       LocaleOption[];
  timezones:     LocaleOption[];
  dateFormats:   LocaleOption[];
  numberFormats: LocaleOption[];
  currencies:    LocaleOption[];
}
