import { apiFetch, parseJsonOrThrow } from '@/lib/api';

/** The server wants a fresh sign-in (within 10 minutes) before deleting the account. */
export class ReauthRequiredError extends Error {
  constructor() {
    super('Please confirm it is you first.');
  }
}

export async function exportMyData(): Promise<unknown> {
  return parseJsonOrThrow(await apiFetch('/api/v1/me/export'), 'Data export');
}

export async function deleteMyAccount(): Promise<void> {
  const response = await apiFetch('/api/v1/me', { method: 'DELETE' });
  if (response.status === 204) return;
  if (response.status === 401) throw new ReauthRequiredError();
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(body?.message ?? 'Your account could not be deleted. Please try again.');
}
