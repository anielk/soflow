import { getApiBaseUrl } from './api';
import { getAuthToken } from './auth';
import type {
  CreatorRecord,
  LocaleOptions,
  NewWorkspaceMember,
  OnboardingStatus,
  WorkspaceMemberRecord,
  WorkspaceProfile,
} from '@/types/workspace';

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
    if (parsed?.error ?? parsed?.message) message = parsed.error ?? parsed.message;
  } catch {
    // response body wasn't JSON — keep the fallback message
  }
  throw new Error(message);
}

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
      let message = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (parsed?.error ?? parsed?.message) message = parsed.error ?? parsed.message;
      } catch {
        // response body wasn't JSON — keep the generic message
      }
      reject(new Error(message));
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
