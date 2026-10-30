// Pure marketplace rules shared by the screens and `frontend/test/marketplaceRules.test.mjs`. No React or app
// imports here so Node can run the tests directly.

/** Values the backend accepts for `condition` (anything else is a 400). */
export const CONDITIONS = [
  { id: 'Brand New', hint: 'Unopened, with tags or box' },
  { id: 'Like New', hint: 'Barely used, no visible wear' },
  { id: 'Gently Used', hint: 'Normal wear, works perfectly' },
  { id: 'Fair', hint: 'Noticeable wear, priced to move' },
  { id: 'Used', hint: 'Well used, still works' },
] as const;

export const REPORT_REASONS = [
  'Scam or fraud',
  'Prohibited item',
  'Misleading details',
  'Already sold',
  'Offensive content',
  'Other',
] as const;

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 4000;
export const LOCATION_MAX = 200;
export const MAX_PHOTOS = 10;
/** Backend `@Digits(integer = 8, fraction = 2)`. */
export const PRICE_MAX = 99_999_999.99;
export const PAGE_SIZE = 24;

export function statusIs(status: string | null | undefined, ...values: string[]) {
  const s = (status ?? '').toLowerCase();
  return values.some((v) => v.toLowerCase() === s);
}

export function statusLabel(status: string | null | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
      return 'Available';
    case 'reserved':
      return 'Reserved';
    case 'sold':
      return 'Sold';
    case 'removed':
      return 'Removed by a moderator';
    default:
      return status ?? '';
  }
}

export type OwnerStatusAction = { status: 'active' | 'reserved' | 'sold'; label: string };

/** Status changes the backend allows an owner from `status` (anything else is a 409; `removed` is moderator-only). */
export function ownerStatusActions(status: string | null | undefined): OwnerStatusAction[] {
  if (statusIs(status, 'active')) {
    return [
      { status: 'reserved', label: 'Mark reserved' },
      { status: 'sold', label: 'Mark sold' },
    ];
  }
  if (statusIs(status, 'reserved')) {
    return [
      { status: 'active', label: 'Make available' },
      { status: 'sold', label: 'Mark sold' },
    ];
  }
  if (statusIs(status, 'sold')) return [{ status: 'active', label: 'Relist' }];
  return [];
}

/**
 * Strict price parsing: digits with an optional `.` and at most two decimals, no letters, signs or thousands
 * separators ("12abc", "1e3" and "-5" are rejected). Returns the number or an error message.
 */
export function parsePrice(text: string): { value: number } | { error: string } {
  const trimmed = text.trim();
  if (trimmed === '') return { error: 'Enter a price, or choose "Give for free".' };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed) && !/^\.\d{1,2}$/.test(trimmed)) {
    return { error: 'Use numbers only, with up to two decimals (for example 25 or 24.99).' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: 'Enter a valid price.' };
  if (value > PRICE_MAX) return { error: 'The highest price allowed is 99,999,999.99.' };
  return { value };
}

/** Query string for `GET /listings`; empty filters are left out so the backend applies its defaults. */
export function listingQuery(
  filters: {
    q?: string;
    categoryId?: string | null;
    condition?: string | null;
    maxPrice?: number | null;
    includeClosed?: boolean;
  },
  page: number,
  size = PAGE_SIZE,
) {
  const params: string[] = [];
  const add = (key: string, value: string) => params.push(`${key}=${encodeURIComponent(value)}`);
  const q = filters.q?.trim();
  if (q) add('q', q);
  if (filters.categoryId) add('categoryId', filters.categoryId);
  if (filters.condition) add('condition', filters.condition);
  if (filters.maxPrice != null) add('maxPrice', String(filters.maxPrice));
  if (filters.includeClosed) add('includeClosed', 'true');
  add('page', String(Math.max(0, page)));
  add('size', String(Math.min(100, Math.max(1, size))));
  return params.join('&');
}

/** Share text without "null"/"undefined" for missing fields. */
export function shareMessage(listing: {
  title: string;
  priceLabel: string;
  location?: string | null;
}) {
  const location = listing.location?.trim();
  return `${listing.title} (${listing.priceLabel}${location ? `, ${location}` : ''}) on ManaBandhu`;
}

export function isNotFound(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 404;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error && error.message ? error.message : fallback;
}
