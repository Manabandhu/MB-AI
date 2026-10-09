import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';
import type {
  CreateRideOfferInput,
  CreateRideRatingInput,
  OwnerRideListing,
  RideChatResponse,
  RideListing,
  RideOffer,
  RideParticipant,
  RideRating,
  RideSeatRequest,
  UpdateRideOfferInput,
} from './types';

export async function listRideOffers(params?: {
  origin?: string;
  destination?: string;
  avoidTolls?: boolean;
  genderPreference?: string;
  isRecurring?: boolean;
}): Promise<RideOffer[]> {
  const query = new URLSearchParams();
  if (params?.origin) query.set('origin', params.origin);
  if (params?.destination) query.set('destination', params.destination);
  if (params?.avoidTolls !== undefined) query.set('avoidTolls', String(params.avoidTolls));
  if (params?.genderPreference) query.set('genderPreference', params.genderPreference);
  if (params?.isRecurring !== undefined) query.set('isRecurring', String(params.isRecurring));
  const qs = query.toString() ? `?${query.toString()}` : '';
  const response = await apiFetch(`/api/v1/rides/offers${qs}`);
  const data = await parseJsonOrThrow<{ content?: RideOffer[] } | RideOffer[]>(
    response,
    'Ride offers',
  );
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}

export async function getRideOffer(rideId: string): Promise<RideOffer> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}`), 'Ride offer');
}

export async function bookRideSeat(
  rideId: string,
  seatsBooked: number,
): Promise<{ id: string; rideId: string; userId: string; seatsBooked: number; status: string }> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/offers/${rideId}/bookings`, {
      method: 'POST',
      body: JSON.stringify({ seatsBooked }),
    }),
    'Book ride seat',
  );
}

export async function getRideDetail(rideId: string): Promise<RideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}`), 'Ride detail');
}

export async function getRideForOwner(rideId: string): Promise<OwnerRideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/owner`), 'Ride owner detail');
}

export async function createRideOffer(input: CreateRideOfferInput): Promise<RideOffer> {
  if (!input.departureAt?.includes('T')) {
    throw new Error('Create ride offer: a departure date and time are required');
  }
  const payload = {
    originArea: input.pickupArea || input.originArea,
    destinationArea: input.destination || input.destinationArea,
    originLat: input.originLat,
    originLng: input.originLng,
    destinationLat: input.destinationLat,
    destinationLng: input.destinationLng,
    routePolyline: input.routePolyline,
    distanceMiles: input.distanceMiles,
    estimatedDurationMins: input.estimatedDurationMins,
    tollPreference: input.tollPreference || 'AVOID_TOLLS',
    estimatedTollAmount: input.estimatedTollAmount ?? 0,
    isRecurring: input.isRecurring ?? false,
    recurrencePattern: input.recurrencePattern || 'ONE_TIME',
    recurringDays: input.recurringDays ?? [],
    luggageCapacity: input.luggageCapacity || 'MEDIUM',
    genderPreference: input.genderPreference || 'ANY',
    departureAt: input.departureAt,
    seatsTotal: input.seatsTotal,
    contribution:
      typeof input.contribution === 'number' ? `$${input.contribution} / seat` : input.contribution,
  };
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rides/offers', { method: 'POST', body: JSON.stringify(payload) }),
    'Create ride offer',
  );
}

export async function reactivateRideOffer(
  rideId: string,
  newDepartureAt?: string,
): Promise<RideOffer> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/offers/${rideId}/re-activate`, {
      method: 'POST',
      body: JSON.stringify({ newDepartureAt: newDepartureAt || null }),
    }),
    'Re-activate ride offer',
  );
}

export async function updateRideStatus(
  rideId: string,
  status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string,
): Promise<RideOffer> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/offers/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    'Update ride status',
  );
}

export async function provisionRideChat(rideId: string): Promise<RideChatResponse> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/offers/${rideId}/chat`, {
      method: 'POST',
    }),
    'Provision ride coordination chat',
  );
}

export async function updateRideOffer(
  rideId: string,
  input: UpdateRideOfferInput,
): Promise<OwnerRideListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/${rideId}`, { method: 'PATCH', body: JSON.stringify(input) }),
    'Update ride offer',
  );
}

export async function getMyRides(): Promise<OwnerRideListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rides/mine'), 'My rides');
}

export async function getRideHistory(): Promise<RideListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rides/history'), 'Ride history');
}

export async function getSavedRides(): Promise<RideListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rides/saved'), 'Saved rides');
}

export async function saveRide(rideId: string): Promise<RideListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/${rideId}/favorite`, { method: 'POST' }),
    'Save ride',
  );
}

export async function unsaveRide(rideId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rides/${rideId}/favorite`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Unsave ride failed: ${response.status}`);
}

export async function listSeatRequests(rideId: string): Promise<RideSeatRequest[]> {
  const rows = await parseJsonOrThrow<BackendRideRequest[]>(
    await apiFetch(`/api/v1/rides/offers/${rideId}/requests`),
    'Seat requests',
  );
  return rows.map((row) => ({
    id: row.id,
    rideId: row.rideId,
    requesterId: row.riderId,
    requesterName: `Rider ${row.riderId.slice(0, 4).toUpperCase()}`,
    pickupArea: '',
    seatsRequested: row.seatsRequested,
    message: row.message ?? undefined,
    status: row.status.toUpperCase() as RideSeatRequest['status'],
    createdAt: row.createdAt,
  }));
}

export async function updateSeatRequestStatus(
  requestId: string,
  status: string,
): Promise<RideSeatRequest> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase() }),
    }),
    'Update seat request status',
  );
}

export async function listParticipants(rideId: string): Promise<RideParticipant[]> {
  const rows = await parseJsonOrThrow<BackendRideParticipant[]>(
    await apiFetch(`/api/v1/rides/offers/${rideId}/participants`),
    'Ride participants',
  );
  return rows.map((row) => ({
    id: row.id,
    rideId: row.rideId,
    userId: row.userId,
    name: `${row.role === 'driver' ? 'Driver' : 'Rider'} ${row.userId.slice(0, 4).toUpperCase()}`,
    role: row.role.toUpperCase() as RideParticipant['role'],
    status: 'CONFIRMED',
    tripShared: false,
  }));
}

export async function submitRideRating(
  rideId: string,
  input: CreateRideRatingInput,
): Promise<RideRating> {
  // The backend stores one 1-5 score per person; the three category scores are averaged into it.
  const ride = await getRideOffer(rideId);
  const rating = Math.round(
    (input.safetyRating + input.timelinessRating + input.comfortRating) / 3,
  );
  const saved = await parseJsonOrThrow<BackendRideRating>(
    await apiFetch(`/api/v1/rides/offers/${rideId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ rateeId: ride.driverId, rating, comment: input.comment }),
    }),
    'Submit ride rating',
  );
  return toRideRating(saved);
}

export async function getRideRating(rideId: string): Promise<RideRating | null> {
  const [ratings, { data }] = await Promise.all([
    parseJsonOrThrow<BackendRideRating[]>(
      await apiFetch(`/api/v1/rides/offers/${rideId}/ratings`),
      'Ride rating',
    ),
    supabase.auth.getSession(),
  ]);
  const mine = ratings.find((r) => r.raterId === data.session?.user.id);
  return mine ? toRideRating(mine) : null;
}

type BackendRideRequest = {
  id: string;
  rideId: string;
  riderId: string;
  seatsRequested: number;
  message?: string | null;
  status: string;
  createdAt: string;
};

type BackendRideParticipant = { id: string; rideId: string; userId: string; role: string };

type BackendRideRating = {
  id: string;
  rideId: string;
  raterId: string;
  rateeId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

function toRideRating(row: BackendRideRating): RideRating {
  return {
    id: row.id,
    rideId: row.rideId,
    raterId: row.raterId,
    ratedId: row.rateeId,
    safetyRating: row.rating,
    timelinessRating: row.rating,
    comfortRating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt,
  };
}
