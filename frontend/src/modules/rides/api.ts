import { apiFetch, parseJson } from '@/lib/api';
import { type RawPage, toPage } from '@/lib/springPage';
import type {
  CreateRideOfferInput,
  CreateRideRatingInput,
  Ride,
  RideBooking,
  RideChatResponse,
  RideParticipant,
  RideRating,
  RideSeatRequest,
  UpdateRideOfferInput,
} from './types';
import { contributionAmount, contributionLabel, contributionText } from './utils/rideFormat';

// ─── Backend shapes ──────────────────────────────────────────────────────────────────────────────────────────────
// Field names follow the Java records (`RideOfferView`, `RideBooking`, `RideRequest`, `RideParticipant`,
// `RideRatingView`). Everything is mapped to the view types in `types.ts` here and nowhere else.

type BackendRide = {
  id: string;
  driverId?: string | null;
  isDriver?: boolean;
  isMember?: boolean;
  /** Some Jackson versions drop the `is` prefix of record booleans. */
  driver?: boolean;
  member?: boolean;
  originArea?: string | null;
  destinationArea?: string | null;
  originLat?: number | string | null;
  originLng?: number | string | null;
  destinationLat?: number | string | null;
  destinationLng?: number | string | null;
  routePolyline?: string | null;
  distanceMiles?: number | string | null;
  estimatedDurationMins?: number | null;
  tollPreference?: string | null;
  estimatedTollAmount?: number | string | null;
  isRecurring?: boolean | null;
  recurrencePattern?: string | null;
  recurringDays?: string[] | null;
  luggageCapacity?: string | null;
  genderPreference?: string | null;
  completedAt?: string | null;
  conversationId?: string | null;
  chatExpiresAt?: string | null;
  departureAt: string;
  seatsTotal?: number | null;
  seatsAvailable?: number | null;
  contribution?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BackendBooking = {
  id: string;
  rideId: string;
  userId: string;
  seatsBooked: number;
  status?: string | null;
  createdAt?: string | null;
};

type BackendRequest = {
  id: string;
  rideId: string;
  riderId: string;
  seatsRequested: number;
  message?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type BackendParticipant = {
  id: string;
  rideId: string;
  userId: string;
  role?: string | null;
  joinedAt?: string | null;
};

type BackendRating = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
};

const num = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The one place the backend ride shape becomes the screens' `Ride`. */
export function toRide(row: BackendRide): Ride {
  const originArea = row.originArea?.trim() || 'Pickup not set';
  const destinationArea = row.destinationArea?.trim() || 'Destination not set';
  const routeLabel = `${originArea} → ${destinationArea}`;
  return {
    id: row.id,
    driverId: row.driverId ?? null,
    isDriver: Boolean(row.isDriver ?? row.driver),
    isMember: Boolean(row.isMember ?? row.member),
    originArea,
    destinationArea,
    routeLabel,
    originLat: num(row.originLat),
    originLng: num(row.originLng),
    destinationLat: num(row.destinationLat),
    destinationLng: num(row.destinationLng),
    routePolyline: row.routePolyline || null,
    distanceMiles: num(row.distanceMiles),
    estimatedDurationMins: num(row.estimatedDurationMins),
    tollPreference: row.tollPreference ?? null,
    estimatedTollAmount: num(row.estimatedTollAmount),
    isRecurring: Boolean(row.isRecurring),
    recurrencePattern: row.recurrencePattern ?? null,
    recurringDays: row.recurringDays ?? [],
    luggageCapacity: row.luggageCapacity ?? null,
    genderPreference: row.genderPreference ?? null,
    completedAt: row.completedAt ?? null,
    conversationId: row.conversationId ?? null,
    chatExpiresAt: row.chatExpiresAt ?? null,
    departureAt: row.departureAt,
    seatsTotal: row.seatsTotal ?? 0,
    seatsAvailable: row.seatsAvailable ?? 0,
    contribution: row.contribution ?? null,
    contributionAmount: contributionAmount(row.contribution),
    contributionLabel: contributionLabel(row.contribution),
    status: (row.status ?? '').toLowerCase(),
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

const toBooking = (row: BackendBooking): RideBooking => ({
  id: row.id,
  rideId: row.rideId,
  userId: row.userId,
  seatsBooked: row.seatsBooked,
  status: (row.status ?? '').toLowerCase(),
  createdAt: row.createdAt ?? null,
});

const toRequest = (row: BackendRequest): RideSeatRequest => ({
  id: row.id,
  rideId: row.rideId,
  riderId: row.riderId,
  seatsRequested: row.seatsRequested,
  message: row.message ?? null,
  status: (row.status ?? '').toLowerCase(),
  createdAt: row.createdAt ?? null,
});

const toParticipant = (row: BackendParticipant): RideParticipant => ({
  id: row.id,
  rideId: row.rideId,
  userId: row.userId,
  role: (row.role ?? '').toLowerCase(),
  joinedAt: row.joinedAt ?? null,
});

const toRating = (row: BackendRating): RideRating => ({
  id: row.id,
  rating: row.rating,
  comment: row.comment ?? null,
  createdAt: row.createdAt ?? null,
});

// ─── Rides ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export type RideSearchParams = {
  origin?: string;
  destination?: string;
  avoidTolls?: boolean;
  genderPreference?: string;
  isRecurring?: boolean;
  /** Zero-based page. Defaults to 0. */
  page?: number;
  /** Page size; the backend caps it. Defaults to 50. */
  size?: number;
};

/** One page of search results plus what the server says about the rest. */
export type RidePage = {
  rides: Ride[];
  page: number;
  /** Total matching rides on the server. */
  total: number;
  hasMore: boolean;
};

/**
 * Upcoming active rides, soonest first (`GET /offers`, a Spring page). Origin, destination, tolls, women-only and
 * recurring are filtered by the server; the departure window and luggage are not, so screens filter loaded pages
 * and offer "Load more".
 */
export async function listRideOffersPage(params: RideSearchParams = {}): Promise<RidePage> {
  const page = params.page ?? 0;
  const size = params.size ?? 50;
  const query = new URLSearchParams();
  if (params.origin?.trim()) query.set('origin', params.origin.trim());
  if (params.destination?.trim()) query.set('destination', params.destination.trim());
  if (params.avoidTolls) query.set('avoidTolls', 'true');
  if (params.genderPreference) query.set('genderPreference', params.genderPreference);
  if (params.isRecurring !== undefined) query.set('isRecurring', String(params.isRecurring));
  query.set('page', String(page));
  query.set('size', String(size));
  const result = toPage(
    await parseJson<RawPage<BackendRide>>(
      await apiFetch(`/api/v1/rides/offers?${query.toString()}`),
    ),
    page,
    size,
  );
  return {
    rides: result.content.map(toRide),
    page: result.number,
    total: result.totalElements,
    hasMore: !result.last,
  };
}

/** First page of upcoming active rides (see `listRideOffersPage`). */
export async function listRideOffers(params: RideSearchParams = {}): Promise<Ride[]> {
  return (await listRideOffersPage(params)).rides;
}

/** One ride; member-only fields are present when the signed-in viewer is a member. */
export async function getRide(rideId: string): Promise<Ride> {
  return toRide(await parseJson<BackendRide>(await apiFetch(`/api/v1/rides/offers/${rideId}`)));
}

/** The ride for its driver (403 for anyone else). */
export async function getRideForOwner(rideId: string): Promise<Ride> {
  return toRide(
    await parseJson<BackendRide>(await apiFetch(`/api/v1/rides/offers/${rideId}/owner`)),
  );
}

export async function createRideOffer(input: CreateRideOfferInput): Promise<Ride> {
  const payload = {
    originArea: input.originArea.trim(),
    destinationArea: input.destinationArea.trim(),
    originLat: input.originLat,
    originLng: input.originLng,
    destinationLat: input.destinationLat,
    destinationLng: input.destinationLng,
    routePolyline: input.routePolyline,
    distanceMiles: input.distanceMiles,
    estimatedDurationMins: input.estimatedDurationMins,
    tollPreference: input.tollPreference,
    isRecurring: input.isRecurring,
    recurrencePattern: input.recurrencePattern,
    recurringDays: input.recurringDays,
    luggageCapacity: input.luggageCapacity,
    genderPreference: input.genderPreference,
    departureAt: input.departureAt,
    seatsTotal: input.seatsTotal,
    contribution: contributionText(input.contributionAmount),
  };
  return toRide(
    await parseJson<BackendRide>(
      await apiFetch('/api/v1/rides/offers', { method: 'POST', body: JSON.stringify(payload) }),
    ),
  );
}

/** Driver edits (`PATCH /offers/{id}`). The server rejects seat counts below what riders hold. */
export async function updateRideOffer(rideId: string, input: UpdateRideOfferInput): Promise<Ride> {
  const payload: Record<string, unknown> = {};
  if (input.seatsTotal !== undefined) payload.seatsTotal = input.seatsTotal;
  if (input.seatsAvailable !== undefined) payload.seatsAvailable = input.seatsAvailable;
  if (input.contributionAmount !== undefined) {
    payload.contribution = contributionText(input.contributionAmount);
  }
  return toRide(
    await parseJson<BackendRide>(
      await apiFetch(`/api/v1/rides/offers/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    ),
  );
}

/**
 * Lifecycle change (`PATCH /offers/{id}/status`): active → in_progress|completed|cancelled,
 * in_progress → completed|cancelled. Cancelling releases and notifies every rider.
 */
export async function updateRideStatus(
  rideId: string,
  status: 'in_progress' | 'completed' | 'cancelled',
): Promise<Ride> {
  return toRide(
    await parseJson<BackendRide>(
      await apiFetch(`/api/v1/rides/offers/${rideId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    ),
  );
}

/** Deletes the ride after releasing and notifying its riders. */
export async function deleteRide(rideId: string): Promise<void> {
  await parseJsonOrEmpty(await apiFetch(`/api/v1/rides/offers/${rideId}`, { method: 'DELETE' }));
}

/** Posts a copy of the ride at a new future departure (driver only). Returns the new ride. */
export async function reactivateRideOffer(rideId: string, newDepartureAt: string): Promise<Ride> {
  return toRide(
    await parseJson<BackendRide>(
      await apiFetch(`/api/v1/rides/offers/${rideId}/re-activate`, {
        method: 'POST',
        body: JSON.stringify({ newDepartureAt }),
      }),
    ),
  );
}

export async function provisionRideChat(rideId: string): Promise<RideChatResponse> {
  return parseJson<RideChatResponse>(
    await apiFetch(`/api/v1/rides/offers/${rideId}/chat`, { method: 'POST' }),
  );
}

// ─── Lists ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Rides the signed-in user drives. */
export async function getMyRides(): Promise<Ride[]> {
  return (await parseJson<BackendRide[]>(await apiFetch('/api/v1/rides/mine'))).map(toRide);
}

/** Completed, cancelled or departed rides the user drove or rode on. */
export async function getRideHistory(): Promise<Ride[]> {
  return (await parseJson<BackendRide[]>(await apiFetch('/api/v1/rides/history'))).map(toRide);
}

/** Bookmarked and joined rides. */
export async function getSavedRides(): Promise<Ride[]> {
  return (await parseJson<BackendRide[]>(await apiFetch('/api/v1/rides/saved'))).map(toRide);
}

export async function saveRide(rideId: string): Promise<Ride> {
  return toRide(
    await parseJson<BackendRide>(
      await apiFetch(`/api/v1/rides/${rideId}/favorite`, { method: 'POST' }),
    ),
  );
}

export async function unsaveRide(rideId: string): Promise<void> {
  await parseJsonOrEmpty(await apiFetch(`/api/v1/rides/${rideId}/favorite`, { method: 'DELETE' }));
}

// ─── Bookings ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Instant confirmed booking: the seats are taken now and the rider joins the ride and its chat. */
export async function bookRideSeat(rideId: string, seatsBooked: number): Promise<RideBooking> {
  return toBooking(
    await parseJson<BackendBooking>(
      await apiFetch(`/api/v1/rides/offers/${rideId}/bookings`, {
        method: 'POST',
        body: JSON.stringify({ seatsBooked }),
      }),
    ),
  );
}

/** The driver sees every booking; anyone else sees only their own. */
export async function listRideBookings(rideId: string): Promise<RideBooking[]> {
  return (
    await parseJson<BackendBooking[]>(await apiFetch(`/api/v1/rides/offers/${rideId}/bookings`))
  ).map(toBooking);
}

/** The signed-in rider's bookings across rides. */
export async function getMyBookings(): Promise<RideBooking[]> {
  return (await parseJson<BackendBooking[]>(await apiFetch('/api/v1/rides/my-bookings'))).map(
    toBooking,
  );
}

/** Cancels a booking (the rider, or the driver for a rider). Returns the seats and removes chat access. */
export async function cancelBooking(bookingId: string): Promise<RideBooking> {
  return toBooking(
    await parseJson<BackendBooking>(
      await apiFetch(`/api/v1/rides/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }),
    ),
  );
}

// ─── Seat requests ─────────────────────────────────────────────────────────────────────────────────────────────────

export async function listSeatRequests(rideId: string): Promise<RideSeatRequest[]> {
  return (
    await parseJson<BackendRequest[]>(await apiFetch(`/api/v1/rides/offers/${rideId}/requests`))
  ).map(toRequest);
}

export async function updateSeatRequestStatus(
  requestId: string,
  status: 'accepted' | 'rejected' | 'withdrawn',
): Promise<RideSeatRequest> {
  return toRequest(
    await parseJson<BackendRequest>(
      await apiFetch(`/api/v1/rides/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    ),
  );
}

// ─── Participants and ratings ─────────────────────────────────────────────────────────────────────────────────────

/** Members only (driver, passengers, admins). */
export async function listParticipants(rideId: string): Promise<RideParticipant[]> {
  return (
    await parseJson<BackendParticipant[]>(
      await apiFetch(`/api/v1/rides/offers/${rideId}/participants`),
    )
  ).map(toParticipant);
}

/** Only after the ride is completed (409 otherwise); a passenger omits `rateeId` to rate the driver. */
export async function submitRideRating(
  rideId: string,
  input: CreateRideRatingInput,
): Promise<void> {
  await parseJson<unknown>(
    await apiFetch(`/api/v1/rides/offers/${rideId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({
        rateeId: input.rateeId ?? null,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      }),
    }),
  );
}

export async function listRideRatings(rideId: string): Promise<RideRating[]> {
  return (
    await parseJson<BackendRating[]>(await apiFetch(`/api/v1/rides/offers/${rideId}/ratings`))
  ).map(toRating);
}

/** For 204 responses: throws the server's reason on failure, ignores the empty body on success. */
async function parseJsonOrEmpty(response: Response): Promise<void> {
  if (response.ok) return;
  await parseJson<unknown>(response);
}
