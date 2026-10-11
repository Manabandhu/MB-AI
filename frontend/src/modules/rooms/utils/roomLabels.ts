/** Room types offered by the form and the filters (stored as the label itself, ≤50 chars). */
export const ROOM_TYPES = [
  'Private Room',
  'Shared 2B2B',
  '1BHK Studio',
  'Master Bed w/ Bath',
  'Entire House / Sublease',
] as const;

/** Values accepted by the backend (anything else is a 400). Labels are display-only. */
export const DIETARY_OPTIONS = [
  { id: 'ANY', label: 'Any diet' },
  { id: 'PURE_VEG', label: 'Pure veg only' },
  { id: 'VEG_PREFERRED', label: 'Veg preferred' },
  { id: 'VEG_FRIENDLY', label: 'Veg friendly' },
  { id: 'NON_VEG_ALLOWED', label: 'Non-veg allowed' },
] as const;

export const GENDER_OPTIONS = [
  { id: 'ANY', label: 'Any gender' },
  { id: 'FEMALE_ONLY', label: 'Female only' },
  { id: 'MALE_ONLY', label: 'Male only' },
] as const;

export const BATHROOM_OPTIONS = [
  { id: 'SHARED', label: 'Shared bath' },
  { id: 'PRIVATE_DEDICATED', label: 'Dedicated bath' },
  { id: 'PRIVATE_ATTACHED', label: 'Private attached bath' },
] as const;

export const LEASE_TERMS = [
  { id: 'FLEXIBLE', label: 'Flexible' },
  { id: 'MONTH_TO_MONTH', label: 'Month-to-month' },
  { id: 'SHORT_TERM', label: 'Short term (1–3 mo)' },
  { id: 'SIX_MONTHS', label: '6 months' },
  { id: 'LONG_TERM', label: 'Long term (6–12 mo)' },
  { id: 'ONE_YEAR', label: '1 year' },
  { id: 'SUBLEASE', label: 'Sublease' },
] as const;

function labelFrom(options: readonly { id: string; label: string }[], value?: string | null) {
  if (!value) return null;
  return options.find((o) => o.id === value.toUpperCase())?.label ?? value;
}

export const dietaryLabel = (v?: string | null) => labelFrom(DIETARY_OPTIONS, v);
export const genderLabel = (v?: string | null) => labelFrom(GENDER_OPTIONS, v);
export const bathroomLabel = (v?: string | null) => labelFrom(BATHROOM_OPTIONS, v);
export const leaseTermLabel = (v?: string | null) => labelFrom(LEASE_TERMS, v);

/** Display label for a stored amenity value (catalog code or free text). */
export function amenityLabel(value: string, catalog?: readonly { code: string; label: string }[]) {
  return catalog?.find((a) => a.code === value)?.label ?? value;
}

export function statusLabel(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
}

/** True for an `ApiError` (or any error carrying `status`) with HTTP 404. */
export function isNotFound(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 404;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** YYYY-MM-DD in the device's local time zone. */
export function localIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Validates a move-in date: real YYYY-MM-DD calendar date, not before today. Returns an error or null. */
export function moveInDateError(value: string, today = localIsoDate()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Use the format YYYY-MM-DD.';
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return 'That date does not exist.';
  }
  if (value < today) return 'Move-in date cannot be in the past.';
  return null;
}

/** `StatusBadge` tone for a listing status: live is success, paused or sent back is a warning. */
export function statusTone(status?: string | null): 'success' | 'warning' | 'info' | 'neutral' {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
      return 'success';
    case 'paused':
    case 'rejected':
      return 'warning';
    case 'rented':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Archiving is final (no transition out of `archived`), so it is always confirmed as destructive. */
export const ARCHIVE_CONFIRM = {
  title: 'Archive listing?',
  body: "It leaves search for good and can't be relisted.",
  confirmLabel: 'Archive',
  destructive: true,
} as const;
