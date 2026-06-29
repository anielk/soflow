// Platform administration types.
// These describe the internal admin data layer — not customer-facing.

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'USER';

export type WorkspacePlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface AdminUser {
  id:        string;
  email:     string;
  username:  string;
  name:      string | null;
  role:      UserRole;
  isCreator: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id:          string;
  name:        string;
  slug:        string;
  plan:        WorkspacePlan;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
  memberCount?: number;
}

export interface WorkspaceMember {
  id:          string;
  workspaceId: string;
  userId:      string;
  role:        UserRole;
  joinedAt:    string;
  user?:       AdminUser;
  workspace?:  Workspace;
}

export interface PlatformStats {
  totalWorkspaces:    number;
  activeWorkspaces:   number;
  totalUsers:         number;
  totalCreators:      number;
  aiConnectionsActive: number;
  mrr:                number;  // monthly recurring revenue USD
}

export interface FeatureFlag {
  id:          string;
  key:         string;
  name:        string;
  description: string;
  enabled:     boolean;
  rolloutPct:  number;    // 0–100
  workspaceIds: string[]; // empty = global
  updatedAt:   string;
}

export interface PlatformLog {
  id:        string;
  level:     'info' | 'warn' | 'error' | 'debug';
  service:   string;
  message:   string;
  meta:      Record<string, unknown>;
  timestamp: string;
}
