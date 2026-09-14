import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type {
  CreateRideOfferInput,
  CreateRideRatingInput,
  CreateRideRequestInput,
  OwnerRideListing,
  RideChatResponse,
  RideListing,
  RideOffer,
  RideParticipant,
  RideRating,
  RideRequest,
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

export async function getRidesScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/screens/${screenId}`), 'Rides screen');
}

export async function getRideDetail(rideId: string): Promise<RideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}`), 'Ride detail');
}

export async function getRideForOwner(rideId: string): Promise<OwnerRideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/owner`), 'Ride owner detail');
}

export async function createRideOffer(input: CreateRideOfferInput): Promise<RideOffer> {
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
    departureAt:
      input.departureAt && input.departureAt.includes('T')
        ? input.departureAt
        : new Date(Date.now() + 86400000).toISOString(),
    seatsTotal: input.seatsTotal,
    contribution:
      typeof input.contribution === 'number'
        ? `$${input.contribution} / seat`
        : input.contribution || '$6 / seat',
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

export async function deleteRide(rideId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rides/${rideId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Delete ride failed: ${response.status}`);
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

export async function createRideRequest(input: CreateRideRequestInput): Promise<RideRequest> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rides/requests', { method: 'POST', body: JSON.stringify(input) }),
    'Create ride request',
  );
}

export async function getMyRideRequests(): Promise<RideRequest[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rides/my-requests'), 'My ride requests');
}

export async function listSeatRequests(rideId: string): Promise<RideSeatRequest[]> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/seat-requests`), 'Seat requests');
}

export async function updateSeatRequestStatus(
  requestId: string,
  status: string,
): Promise<RideSeatRequest> {
  const body = JSON.stringify({ status });
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/seat-requests/${requestId}/status`, {
      method: 'PATCH',
      body,
    }),
    'Update seat request status',
  );
}

export async function listParticipants(rideId: string): Promise<RideParticipant[]> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/${rideId}/participants`),
    'Ride participants',
  );
}

export async function submitRideRating(
  rideId: string,
  input: CreateRideRatingInput,
): Promise<RideRating> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/${rideId}/ratings`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Submit ride rating',
  );
}

export async function getRideRating(rideId: string): Promise<RideRating | null> {
  try {
    return await parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/ratings`), 'Ride rating');
  } catch {
    return null;
  }
}
