import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRidesScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/screens/${screenId}`), 'Rides screen');
}

export async function getRideDetail(rideId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}`), 'Ride detail');
}

export async function getRideManage(rideId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rides/${rideId}/manage`), 'Ride manage');
}

export async function createRideOffer(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rides/offer', { method: 'POST' }),
    'Create ride offer',
  );
}

export async function createRideRequest(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rides/request', { method: 'POST' }),
    'Create ride request',
  );
}

export async function submitRideRating(rideId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rides/${rideId}/rate`, { method: 'POST' }),
    'Submit ride rating',
  );
}
