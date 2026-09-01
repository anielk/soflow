export type PostType        = 'free' | 'ppv';
// Only 'draft' and 'scheduled' are real today — there is no platform
// integration to actually publish to, so a Post never reaches 'published'
// here (see backend Post model comment). Kept as a 2-value union rather than
// speculatively including 'published'/'failed' states nothing produces yet.
export type PostStatus      = 'draft' | 'scheduled';
export type MediaType       = 'image' | 'video' | 'document';
export type NotifType       = 'like' | 'tip' | 'subscription' | 'renewal' | 'comment' | 'ppv_unlock';
export type StatementStatus = 'paid' | 'pending' | 'processing';

export interface Post {
  id:           string;
  caption:      string;
  type:         PostType;
  status:       PostStatus;
  price?:       number;
  scheduledAt?: string;
  mediaIds:     string[];
  createdAt:    string;
  updatedAt:    string;
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

/** Platform-wide view — only ever fetched by a SUPER_ADMIN via /workspace/admin. */
export interface AdminWorkspaceListItem {
  id:          string;
  name:        string;
  slug:        string;
  plan:        string;
  isActive:    boolean;
  memberCount: number;
  createdAt:   string;
  updatedAt:   string;
}

/** One workspace the signed-in user belongs to — see lib/workspace.ts's listMyWorkspaces, powers the sidebar workspace switcher. */
export interface WorkspaceMembershipSummary {
  id:       string;
  name:     string;
  slug:     string;
  hasLogo:  boolean;
  // WorkspaceMember.role for THIS workspace — never the global User.role.
  role:     string;
  isActive: boolean;
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

export interface DashboardStats {
  totalCreators:      number;
  activeCreators:     number;
  mediaCount:         number;
  storageBytes:       number;
  memberCount:        number;
  draftPostCount:     number;
  scheduledPostCount: number;
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
