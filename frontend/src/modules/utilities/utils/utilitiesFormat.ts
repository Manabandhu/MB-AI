/** Pure utilities helpers; tested by `frontend/test/safetyUtilities.test.mjs`. No React or path aliases here. */

export const PACKAGE_STATUSES = [
  { value: 'PENDING', label: 'Pending', tone: 'neutral' },
  { value: 'IN_TRANSIT', label: 'In transit', tone: 'info' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery', tone: 'primary' },
  { value: 'DELIVERED', label: 'Delivered', tone: 'success' },
  { value: 'EXCEPTION', label: 'Problem', tone: 'danger' },
] as const;

export type PackageTone = (typeof PACKAGE_STATUSES)[number]['tone'];

/** Label and badge tone for a package status, case-insensitively; unknown values are shown as sent. */
export function packageStatus(status: string | null | undefined): {
  label: string;
  tone: PackageTone;
} {
  const match = PACKAGE_STATUSES.find((s) => s.value === String(status ?? '').toUpperCase());
  return match
    ? { label: match.label, tone: match.tone }
    : { label: String(status ?? ''), tone: 'neutral' };
}

/** Case-insensitive match on any of the given fields; an empty term matches everything. */
export function matchesSearch(
  term: string,
  fields: readonly (string | null | undefined)[],
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) =>
    String(f ?? '')
      .toLowerCase()
      .includes(needle),
  );
}

/** "1.2 km" / "350 m"; null when the server sent no distance. */
export function formatDistance(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km) || km < 0) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** `tel:` link (keeps a leading + and digits only); null when there are no digits to dial. */
export function telLink(phone: string | null | undefined): string | null {
  const trimmed = String(phone ?? '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** Web maps search for an address (opens the maps app or site on every platform). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

/** Tracking number check: 4–80 letters, digits, spaces or dashes. */
export function trackingNumberError(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Enter the tracking number.';
  if (v.length < 4 || v.length > 80 || !/^[A-Za-z0-9 -]+$/.test(v)) {
    return 'Use 4–80 letters, numbers, spaces, or dashes.';
  }
  return null;
}
