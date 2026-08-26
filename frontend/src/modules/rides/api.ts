import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRidesScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rides/screens/${screenId}`);
  if (!response.ok) throw new Error(`Rides screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getRideDetail(rideId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rides/${rideId}`);
  if (!response.ok) throw new Error(`Ride detail failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getRideManage(rideId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rides/${rideId}/manage`);
  if (!response.ok) throw new Error(`Ride manage failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function createRideOffer(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/rides/offer', { method: 'POST' });
  if (!response.ok) throw new Error(`Create ride offer failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function createRideRequest(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/rides/request', { method: 'POST' });
  if (!response.ok) throw new Error(`Create ride request failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function submitRideRating(rideId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rides/${rideId}/rate`, { method: 'POST' });
  if (!response.ok) throw new Error(`Submit ride rating failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
