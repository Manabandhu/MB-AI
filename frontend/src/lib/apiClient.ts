import { apiFetch } from '@/lib/api';

export async function parseJsonOrThrow<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.message || data.error || '';
    } catch {
      try {
        detail = await response.text();
      } catch {}
    }
    throw new Error(detail ? `${label}: ${detail}` : `${label} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function parseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await response.text();
  throw new Error(detail || `Request failed: ${response.status}`);
}

export { apiFetch };
