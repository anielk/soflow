import { getApiBaseUrl } from './api';
import { getAuthToken } from './auth';

function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwOnError(response: Response, fallback: string): Promise<void> {
  if (response.ok) return;
  let message = fallback;
  try {
    const parsed = await response.json();
    if (parsed?.message ?? parsed?.error) message = parsed.message ?? parsed.error;
  } catch {
    // response body wasn't JSON — keep the fallback message
  }
  throw new Error(message);
}

async function getJson<T>(path: string, query: object = {}, fallback = 'Request failed'): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, string | number | undefined>)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  const response = await fetch(apiUrl(`${path}${qs ? `?${qs}` : ''}`), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, fallback);
  return response.json();
}

// ─── Audit log ──────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  userLabel: string | null;
  eventType: string;
  category: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  workspaceId?: string;
  userId?: string;
  category?: string;
  eventType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function getAuditLog(filters: AuditLogFilters = {}): Promise<PagedResult<AuditLogEntry>> {
  return getJson('/audit', filters, 'Failed to load audit log');
}

export function getAuditCategories(): Promise<{ categories: string[] }> {
  return getJson('/audit/categories', {}, 'Failed to load audit categories');
}

// ─── Activity log ───────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  actorName: string | null;
  message: string;
  category: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
}

export function getActivityLog(filters: { workspaceId?: string; page?: number; limit?: number } = {}): Promise<PagedResult<ActivityLogEntry>> {
  return getJson('/activity', filters, 'Failed to load activity log');
}

// ─── Health ─────────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'degraded' | 'down' | 'not_configured' | 'planned';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  checks: HealthCheckResult[];
}

export function getHealthReport(): Promise<HealthReport> {
  return getJson('/health', {}, 'Failed to load health report');
}

// ─── System info ────────────────────────────────────────────────────────────

export interface VersionInfo {
  appVersion: string;
  nodeVersion: string;
  gitCommit: string | null;
}

export interface EnvironmentInfo {
  nodeEnv: string;
  storageDriver: string;
  notificationDriver: string;
}

export interface InstalledModule {
  name: string;
  description: string;
}

export function getVersion(): Promise<VersionInfo> {
  return getJson('/system/version', {}, 'Failed to load version info');
}

export function getEnvironment(): Promise<EnvironmentInfo> {
  return getJson('/system/environment', {}, 'Failed to load environment info');
}

export function getInstalledModules(): Promise<{ modules: InstalledModule[] }> {
  return getJson('/system/modules', {}, 'Failed to load installed modules');
}
