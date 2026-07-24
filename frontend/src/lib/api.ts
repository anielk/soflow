const FALLBACK_API_URL = 'http://localhost:4000/v1';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL;
}

/** Single place that turns a route path into a full backend URL — every `lib/*.ts` API module shares this instead of re-declaring it. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Single place that reads the stored auth token — every `lib/*.ts` API module shares this instead of re-declaring it. */
export function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Every backend error response has the shape `{ statusCode, timestamp, path, error }`
 * (see backend's HttpExceptionFilter) — this is the one place that reads it,
 * so every API module surfaces the server's actual error message instead of
 * a generic "request failed" string. A non-JSON body (or a non-error
 * response) falls back to `fallback` rather than throwing on `.json()`.
 */
function extractErrorMessage(parsedBody: unknown, fallback: string): string {
  const body = parsedBody as { error?: string; message?: string } | null;
  return (body?.error ?? body?.message) || fallback;
}

export async function throwOnError(response: Response, fallback: string): Promise<void> {
  if (response.ok) return;
  let message = fallback;
  try {
    message = extractErrorMessage(await response.json(), fallback);
  } catch {
    // response body wasn't JSON — keep the fallback message
  }
  throw new Error(message);
}

/**
 * Same error-message extraction as `throwOnError`, for XMLHttpRequest-based
 * upload flows (progress events aren't available through fetch) — those
 * have a raw response string instead of a fetch `Response` to parse.
 */
export function parseUploadErrorMessage(rawResponseText: string, fallback: string): string {
  try {
    return extractErrorMessage(JSON.parse(rawResponseText), fallback);
  } catch {
    return fallback;
  }
}

async function request<T>(method: string, path: string, data?: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    cache: 'no-store',
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  await throwOnError(response, `API request failed with status ${response.status}`);
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, data: unknown): Promise<T> {
  return request<T>('POST', path, data);
}

export function apiPut<T>(path: string, data: unknown): Promise<T> {
  return request<T>('PUT', path, data);
}

export function apiPatch<T>(path: string, data: unknown): Promise<T> {
  return request<T>('PATCH', path, data);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

// Authentication functions
export async function registerUser(userData: { email: string; password: string; username: string }) {
  return apiPost<{ access_token: string }>('/auth/register', userData);
}

export async function loginUser(credentials: { email: string; password: string }) {
  return apiPost<{ access_token: string }>('/auth/login', credentials);
}

export async function changePassword(dto: { currentPassword: string; newPassword: string }) {
  return apiPut<{ success: boolean; message: string }>('/users/change-password', dto);
}

export async function requestPasswordReset(email: string) {
  return apiPost<{ success: boolean; message: string }>('/auth/forgot-password', { email });
}

export async function resetPassword(dto: { token: string; newPassword: string }) {
  return apiPost<{ success: boolean; message: string }>('/auth/reset-password', dto);
}

export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};
