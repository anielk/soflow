const FALLBACK_API_URL = 'http://localhost:4000/api';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL;
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// Authentication functions
export async function registerUser(userData: { email: string; password: string; username?: string }) {
  return apiPost<{ access_token: string }>('/v1/auth/register', userData);
}

export async function loginUser(credentials: { email: string; password: string }) {
  return apiPost<{ access_token: string }>('/v1/auth/login', credentials);
}

export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};