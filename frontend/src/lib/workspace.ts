import { apiUrl, authHeaders, parseUploadErrorMessage, throwOnError } from './api';
import { getAuthToken } from './auth';
import type {
  ActivityLogItem,
  AuditLogItem,
  CreatorRecord,
  CreatorStats,
  CreatorStatus,
  LocaleOptions,
  NewWorkspaceMember,
  OnboardingStatus,
  WorkspaceMemberRecord,
  WorkspaceProfile,
} from '@/types/workspace';

export async function getWorkspace(): Promise<WorkspaceProfile> {
  const response = await fetch(apiUrl('/workspace'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load workspace');
  return response.json();
}

export interface UpdateWorkspaceInput {
  locale?:       string;
  timezone?:     string;
  dateFormat?:   string;
  numberFormat?: string;
  currency?:     string;
}

export async function updateWorkspace(input: UpdateWorkspaceInput): Promise<WorkspaceProfile> {
  const response = await fetch(apiUrl('/workspace'), {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to update workspace settings');
  return response.json();
}

export async function getLocaleOptions(): Promise<LocaleOptions> {
  const response = await fetch(apiUrl('/workspace/locale-options'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load localization options');
  return response.json();
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await fetch(apiUrl('/workspace/onboarding'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load onboarding status');
  return response.json();
}

export function getWorkspaceLogoUrl(): string {
  return apiUrl('/workspace/logo');
}

/**
 * <img> tags can't send an Authorization header, so the logo is fetched authed
 * and turned into an object URL — same pattern as media thumbnails. Callers
 * must revoke the returned URL when done with it.
 */
export async function fetchWorkspaceLogoBlobUrl(): Promise<string | null> {
  const response = await fetch(getWorkspaceLogoUrl(), { headers: authHeaders() });
  if (response.status === 404) return null;
  await throwOnError(response, 'Failed to load workspace logo');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export function uploadWorkspaceLogo(file: File, options: UploadOptions = {}): Promise<WorkspaceProfile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', apiUrl('/workspace/logo'));
    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
        return;
      }
      reject(new Error(parseUploadErrorMessage(xhr.responseText, `Upload failed (${xhr.status})`)));
    };

    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.onabort = () => reject(new DOMException('Upload canceled', 'AbortError'));

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(formData);
  });
}

export async function listMembers(): Promise<WorkspaceMemberRecord[]> {
  const response = await fetch(apiUrl('/workspace/members'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load team members');
  return response.json();
}

export interface AddMemberInput {
  name:  string;
  email: string;
}

export async function addMember(input: AddMemberInput): Promise<NewWorkspaceMember> {
  const response = await fetch(apiUrl('/workspace/members'), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to add team member');
  return response.json();
}

export async function listCreators(): Promise<CreatorRecord[]> {
  const response = await fetch(apiUrl('/workspace/creators'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load creators');
  return response.json();
}

export interface AddCreatorInput {
  name:   string;
  email?: string;
  phone?: string;
  bio?:   string;
  tags?:  string[];
}

export async function addCreator(input: AddCreatorInput): Promise<CreatorRecord> {
  const response = await fetch(apiUrl('/workspace/creators'), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to add creator');
  return response.json();
}

export async function getCreator(id: string): Promise<CreatorRecord> {
  const response = await fetch(apiUrl(`/workspace/creators/${id}`), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load creator');
  return response.json();
}

export async function getCreatorStats(id: string): Promise<CreatorStats> {
  const response = await fetch(apiUrl(`/workspace/creators/${id}/stats`), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load creator statistics');
  return response.json();
}

export interface UpdateCreatorInput {
  name?:      string;
  email?:     string | null;
  phone?:     string | null;
  bio?:       string | null;
  notes?:     string | null;
  tags?:      string[];
  status?:    CreatorStatus;
  avatarUrl?: string | null;
}

export async function updateCreator(id: string, input: UpdateCreatorInput): Promise<CreatorRecord> {
  const response = await fetch(apiUrl(`/workspace/creators/${id}`), {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to update creator');
  return response.json();
}

export async function deleteCreator(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/workspace/creators/${id}`), { method: 'DELETE', headers: authHeaders() });
  await throwOnError(response, 'Failed to delete creator');
}

export async function listCreatorActivity(creatorId: string, limit = 25): Promise<ActivityLogItem[]> {
  const response = await fetch(
    apiUrl(`/activity?targetId=${encodeURIComponent(creatorId)}&targetType=Creator&limit=${limit}`),
    { headers: authHeaders(), cache: 'no-store' },
  );
  await throwOnError(response, 'Failed to load activity');
  const data = (await response.json()) as { items: ActivityLogItem[] };
  return data.items;
}

export async function listCreatorAuditLog(creatorId: string, limit = 25): Promise<AuditLogItem[]> {
  const response = await fetch(
    apiUrl(`/audit?targetId=${encodeURIComponent(creatorId)}&targetType=Creator&limit=${limit}`),
    { headers: authHeaders(), cache: 'no-store' },
  );
  await throwOnError(response, 'Failed to load audit history');
  const data = (await response.json()) as { items: AuditLogItem[] };
  return data.items;
}
