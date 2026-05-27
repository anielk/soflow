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
