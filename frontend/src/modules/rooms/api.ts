import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRoomsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/screens/${screenId}`), 'Rooms screen');
}

export async function getRoomDetail(roomId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/${roomId}`), 'Room detail');
}

export async function getRoomEdit(roomId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/${roomId}/edit`), 'Room edit');
}

export async function createRoomListing(): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rooms/create-listing', { method: 'POST' }),
    'Create room listing',
  );
}
