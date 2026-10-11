// Pure ride helpers shared by the API mapper and the screens. No React Native imports, so `node --test` can load
// this file directly (see frontend/test/rideFormat.test.mjs).

/** Case-insensitive status check: stored values are lowercase, older clients sent uppercase. */
export function statusIs(status: string | null | undefined, ...values: string[]) {
  const s = (status ?? '').toLowerCase();
  return values.some((v) => v.toLowerCase() === s);
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  confirmed: 'Confirmed',
  accepted: 'Accepted',
  rejected: 'Declined',
  withdrawn: 'Withdrawn',
};

export function statusLabel(status: string | null | undefined) {
  const s = (status ?? '').toLowerCase();
  return (
    STATUS_LABELS[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : 'Unknown')
  );
}

/** The dollar amount in a stored contribution such as `$12 / seat`, `12` or `$$12 / seat`; null if none. */
export function contributionAmount(
  contribution: string | number | null | undefined,
): number | null {
  if (contribution == null) return null;
  if (typeof contribution === 'number') return Number.isFinite(contribution) ? contribution : null;
  // Free rides are stored as the text "Free".
  if (/^\s*free\s*$/i.test(contribution)) return 0;
  const match = /\d+(?:\.\d+)?/.exec(contribution.replace(/,/g, ''));
  if (!match) return null;
  const amount = Number.parseFloat(match[0]);
  return Number.isFinite(amount) ? amount : null;
}

function money(amount: number) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/** `$12 / seat` (never `$$12`), `Free` for 0, or null when no amount was set. */
export function contributionLabel(contribution: string | number | null | undefined): string | null {
  const amount = contributionAmount(contribution);
  if (amount == null) {
    const text = typeof contribution === 'string' ? contribution.trim() : '';
    return text || null;
  }
  return amount === 0 ? 'Free' : `${money(amount)} / seat`;
}

/** What the backend stores for a per-seat amount. */
export function contributionText(amount: number) {
  return amount === 0 ? 'Free' : `${money(amount)} / seat`;
}

/** Inline error for the seats field (1–8, whole numbers), or null when valid. */
export function seatsError(value: string | number): string | null {
  const text = String(value).trim();
  if (!text) return 'Enter the number of seats.';
  if (!/^\d+$/.test(text)) return 'Use a whole number.';
  const n = Number(text);
  if (n < 1) return 'Offer at least 1 seat.';
  if (n > 8) return 'At most 8 seats.';
  return null;
}

/** Inline error for a per-seat amount in dollars (0 = free), or null when valid. */
export function amountError(value: string): string | null {
  const text = value.trim();
  if (!text) return 'Enter an amount (0 for free).';
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return 'Use dollars and cents, e.g. 12 or 12.50.';
  if (Number(text) > 10000) return 'That amount is too high.';
  return null;
}

/** Midnight (local) of `now` plus `dayOffset` days, at `hour:minute`. */
export function departureFrom(dayOffset: number, hour: number, minute: number, now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute, 0, 0);
}

/** Error for a chosen departure, or null when it is in the future. */
export function departureError(departure: Date | null, now = new Date()): string | null {
  if (!departure || Number.isNaN(departure.getTime())) return 'Choose a departure date and time.';
  if (departure.getTime() <= now.getTime()) return 'Departure must be in the future.';
  return null;
}

/**
 * Default departure for "Repeat trip": the original time of day on the next day that is still in the future
 * (tomorrow, or later if tomorrow at that time has already passed).
 */
export function nextDepartureAtSameTime(originalIso: string, now = new Date()) {
  const original = new Date(originalIso);
  const hour = Number.isNaN(original.getTime()) ? 9 : original.getHours();
  const minute = Number.isNaN(original.getTime()) ? 0 : original.getMinutes();
  let offset = 1;
  let candidate = departureFrom(offset, hour, minute, now);
  while (candidate.getTime() <= now.getTime()) {
    offset += 1;
    candidate = departureFrom(offset, hour, minute, now);
  }
  return { dayOffset: offset, hour, minute, date: candidate };
}

type BookableRide = {
  isDriver: boolean;
  /** The viewer is already on the ride (a live booking or an accepted seat request). */
  isMember?: boolean;
  status: string;
  seatsAvailable: number;
  departureAt: string;
};

/** Why the viewer cannot book a seat on this ride, or null when booking is possible. */
export function bookingBlockReason(ride: BookableRide, now = new Date()): string | null {
  if (ride.isDriver) return 'This is your ride. Manage it to see bookings and requests.';
  // Members already hold a seat (booking or accepted request); the server refuses a second booking.
  if (ride.isMember) return 'You already have a seat on this ride.';
  if (statusIs(ride.status, 'cancelled')) return 'The driver cancelled this ride.';
  if (statusIs(ride.status, 'completed')) return 'This ride has finished.';
  if (statusIs(ride.status, 'in_progress')) return 'This ride is already under way.';
  if (!statusIs(ride.status, 'active')) return 'This ride is not open for booking.';
  const departs = new Date(ride.departureAt).getTime();
  if (Number.isFinite(departs) && departs <= now.getTime())
    return 'This ride has already departed.';
  if (ride.seatsAvailable <= 0) return 'This ride is full.';
  return null;
}

type SeatBooking = { id: string; userId: string; seatsBooked: number; status: string };
type SeatRequest = { id: string; riderId: string; seatsRequested: number; status: string };

/** The viewer's own hold on a ride: a live booking first, then an accepted or pending seat request. */
export type ViewerSeat =
  | { kind: 'booking'; id: string; seats: number; status: string }
  | { kind: 'request'; id: string; seats: number; status: string };

/**
 * Finds the signed-in rider's live booking or open seat request among the rows the server returned (a rider only
 * ever receives their own). Cancelled bookings and declined or withdrawn requests do not count.
 */
export function viewerSeat(
  userId: string | null | undefined,
  bookings: readonly SeatBooking[] = [],
  requests: readonly SeatRequest[] = [],
): ViewerSeat | null {
  if (!userId) return null;
  const booking = bookings.find((b) => b.userId === userId && !statusIs(b.status, 'cancelled'));
  if (booking) {
    return { kind: 'booking', id: booking.id, seats: booking.seatsBooked, status: booking.status };
  }
  const request =
    requests.find((r) => r.riderId === userId && statusIs(r.status, 'accepted')) ??
    requests.find((r) => r.riderId === userId && statusIs(r.status, 'pending'));
  return request
    ? { kind: 'request', id: request.id, seats: request.seatsRequested, status: request.status }
    : null;
}

export type DepartureWindow = 'any' | 'today' | 'tomorrow' | 'week';

/** True when `iso` departs inside the chosen window (local days). */
export function departsInWindow(iso: string, when: DepartureWindow, now = new Date()) {
  if (when === 'any') return true;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  if (when === 'today') return t >= start && t < start + day;
  if (when === 'tomorrow') return t >= start + day && t < start + 2 * day;
  return t < start + 7 * day;
}

/** Room for more than a backpack. */
export function hasLuggageSpace(luggageCapacity?: string | null) {
  return ['MEDIUM', 'LARGE_SUITCASE'].includes((luggageCapacity ?? '').toUpperCase());
}

/**
 * Link to ride search from free text: "Austin to Dallas" or "Austin → Dallas" fills both ends; anything else is
 * treated as the destination.
 */
export function rideSearchHref(text: string) {
  // "carpool" / "ride" are what people type around a route, not part of the place names.
  const query = text
    .replace(/\b(carpools?|rides?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!query) return '/rides/search';
  const parts = query.split(/\s+to\s+|\s*→\s*|\s*->\s*/i).map((p) => p.trim());
  const params = new URLSearchParams();
  if (parts.length >= 2 && parts[0] && parts[1]) {
    params.set('from', parts[0]);
    params.set('to', parts[1]);
  } else {
    params.set('to', query);
  }
  return `/rides/search?${params.toString()}`;
}

/** Badge tone for a ride, booking or request status. */
export function statusTone(
  status: string | null | undefined,
): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'confirmed' || s === 'accepted') return 'success';
  if (s === 'in_progress') return 'info';
  if (s === 'pending') return 'warning';
  if (s === 'cancelled') return 'danger';
  return 'neutral';
}

/**
 * A ride the viewer rides on (not drives). `GET /rides/saved` returns these alongside bookmarks with no flag to tell
 * them apart, and unsaving one does nothing, so screens show "Joined" instead of a heart for them.
 */
export function isJoinedRide(ride: { isMember: boolean; isDriver: boolean }) {
  return ride.isMember && !ride.isDriver;
}

/** Seats riders hold on a ride (total minus open), never negative. */
export function heldSeats(ride: { seatsTotal: number; seatsAvailable: number }) {
  return Math.max(0, ride.seatsTotal - ride.seatsAvailable);
}

/** True for an error carrying HTTP status 404 (`ApiError`). */
export function isNotFound(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 404;
}

/** True for an error carrying HTTP status 403 (not the driver, not a member). */
export function isForbidden(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 403;
}

/** True for an error carrying HTTP status 429 (maps rate limit). */
export function isRateLimited(error: unknown) {
  return (error as { status?: unknown } | null)?.status === 429;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error && error.message ? error.message : fallback;
}

const TOLL_LABELS: Record<string, string> = {
  AVOID_TOLLS: 'Avoids toll roads',
  TOLLS_INCLUDED: 'Tolls included in the price',
  TOLLS_SPLIT: 'Tolls split among riders',
};
const RECURRENCE_LABELS: Record<string, string> = {
  ONE_TIME: 'One-time trip',
  WEEKDAYS: 'Repeats on weekdays',
  DAILY: 'Repeats daily',
  WEEKLY: 'Repeats weekly',
  CUSTOM: 'Repeats on chosen days',
};
const LUGGAGE_LABELS: Record<string, string> = {
  BACKPACK_ONLY: 'Backpack only',
  MEDIUM: 'Medium bags',
  LARGE_SUITCASE: 'Large suitcases OK',
};
const GENDER_LABELS: Record<string, string> = {
  FEMALE_ONLY: 'Women only',
  MALE_ONLY: 'Men only',
};

const label = (map: Record<string, string>, v?: string | null) =>
  v ? (map[v.toUpperCase()] ?? null) : null;

export const tollLabel = (v?: string | null) => label(TOLL_LABELS, v);
export const recurrenceLabel = (v?: string | null) => label(RECURRENCE_LABELS, v);
export const luggageLabel = (v?: string | null) => label(LUGGAGE_LABELS, v);
export const genderLabel = (v?: string | null) => label(GENDER_LABELS, v);

export function isWomenOnly(genderPreference?: string | null) {
  return (genderPreference ?? '').toUpperCase() === 'FEMALE_ONLY';
}

/** `About 1 h 05 min` style duration, or null. */
export function durationLabel(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `About ${h} h ${String(m).padStart(2, '0')} min` : `About ${m} min`;
}

/** Short member label from a user id; the app does not have a public profile lookup for ride members yet. */
export function memberLabel(userId: string, role?: string | null) {
  const who = statusIs(role, 'driver') ? 'Driver' : 'Rider';
  return `${who} ${userId.slice(0, 4).toUpperCase()}`;
}
