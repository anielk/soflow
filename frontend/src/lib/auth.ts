import { getApiBaseUrl } from './api';

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const logout = () => {
  const token = getAuthToken();
  if (token && typeof window !== 'undefined') {
    // Fire-and-forget — JWTs are stateless, so this only records the logout
    // for audit purposes. It must never delay or block clearing the local
    // session below.
    const base = getApiBaseUrl().replace(/\/$/, '');
    fetch(`${base}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
  }
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// ─── JWT role utilities ───────────────────────────────────────────────────────
// The backend embeds `role` in the JWT payload. We decode it client-side
// for UI gating only — real authorization happens on the server.

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  return (payload?.role as string) ?? null;
}

export function isSuperAdmin(): boolean {
  return getUserRole() === 'SUPER_ADMIN';
}
