import type { StatusTone } from '@/modules/shared/ui/StatusBadge';
import type { Referral } from '../api';

/** Statuses the backend treats as open (`ReferralsContentService.OPEN_STATUSES`). */
const OPEN = ['pending', 'open', 'active'];

const norm = (status?: string | null) => (status ?? '').trim().toLowerCase();

export function isOpenReferral(referral: Pick<Referral, 'status'>) {
  return OPEN.includes(norm(referral.status));
}

export function referralStatusLabel(status?: string | null) {
  const s = norm(status);
  if (s === 'pending' || s === 'open' || s === 'active') return 'Open';
  if (s === 'closed') return 'Closed';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
}

export function referralStatusTone(status?: string | null): StatusTone {
  return OPEN.includes(norm(status)) ? 'success' : 'neutral';
}

/** Distinct categories present in the list, case-insensitively, in first-seen spelling. */
export function referralCategories(referrals: Pick<Referral, 'category'>[]) {
  const seen = new Map<string, string>();
  for (const r of referrals) {
    const c = r.category?.trim();
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function matchesReferral(
  referral: Pick<Referral, 'title' | 'description' | 'category'>,
  query: string,
  category: string | null,
) {
  if (category && norm(referral.category) !== category.toLowerCase()) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [referral.title, referral.description, referral.category].some((f) =>
    (f ?? '').toLowerCase().includes(q),
  );
}

/** Query-key prefix every referral mutation invalidates. */
export const REFERRALS_KEY = ['referrals'] as const;
