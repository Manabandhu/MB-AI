import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRoomsScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rooms/screens/${screenId}`);
  if (!response.ok) throw new Error(`Rooms screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getRoomDetail(roomId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rooms/${roomId}`);
  if (!response.ok) throw new Error(`Room detail failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getRoomEdit(roomId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rooms/${roomId}/edit`);
  if (!response.ok) throw new Error(`Room edit failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function createRoomListing(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/rooms/create-listing', { method: 'POST' });
  if (!response.ok) throw new Error(`Create room listing failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
