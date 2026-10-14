// Pure admin helpers. Kept free of React Native imports so they run under `node --test`.

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

function normalize(value: unknown): AdminRole | null {
  if (typeof value !== 'string') return null;
  const role = value
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '');
  return role === 'SUPER_ADMIN' || role === 'ADMIN' ? role : null;
}

/**
 * The caller's admin role, from the backend identity (`GET /api/v1/me` → `role`) or the signed JWT's
 * `app_metadata.roles` (string or array). Never from editable `user_metadata`. The server re-checks every call;
 * this only decides what the console shows.
 */
export function adminRoleOf(
  identityRole: string | null | undefined,
  appMetadata: Record<string, unknown> | null | undefined,
): AdminRole | null {
  const candidates: unknown[] = [identityRole];
  const roles = appMetadata?.roles;
  if (Array.isArray(roles)) candidates.push(...roles);
  else candidates.push(roles);
  const found = candidates.map(normalize).filter((r): r is AdminRole => r !== null);
  if (found.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  return found.includes('ADMIN') ? 'ADMIN' : null;
}

/** Whether `role` may open a screen that needs `required`. */
export function hasAdminAccess(role: AdminRole | null, required: AdminRole = 'ADMIN'): boolean {
  if (!role) return false;
  return required === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function adminRoleLabel(role: AdminRole): string {
  return role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin';
}

/** Reports still needing moderation (`OPEN`, `IN_REVIEW`, legacy `PENDING`), case-insensitive. */
export function isOpenReport(status: string | null | undefined): boolean {
  const value = (status ?? '').trim().toUpperCase();
  return value === 'OPEN' || value === 'IN_REVIEW' || value === 'PENDING';
}

/** "IN_REVIEW" → "In review". */
export function statusLabel(status: string | null | undefined): string {
  const value = (status ?? '').trim().replace(/_/g, ' ').toLowerCase();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

export function isSuspended(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'suspended';
}
