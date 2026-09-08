import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type {
  CreateRideOfferInput,
  CreateRideRatingInput,
  CreateRideRequestInput,
  OwnerRideListing,
  RideListing,
  RideParticipant,
  RideRating,
  RideRequest,
  RideSeatRequest,
  UpdateRideOfferInput,
} from './types';

export async function getRidesScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/screens/${screenId}`), 'Rides screen');
}

export async function getRideDetail(rideId: string): Promise<RideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}`), 'Ride detail');
}

export async function getRideForOwner(rideId: string): Promise<OwnerRideListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/owner`), 'Ride owner detail');
}

export async function createRideOffer(input: CreateRideOfferInput): Promise<OwnerRideListing> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rides', { method: 'POST', body: JSON.stringify(input) }),
    'Create ride offer',
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
