import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type {
  CreateBookingInput,
  CreateRoomListingInput,
  CreateSavedSearchInput,
  OwnerRoomListing,
  RoomAnalytics,
  RoomBooking,
  RoomListing,
  RoomReport,
  SavedSearch,
  UpdateRoomListingInput,
} from './types';

export async function getRoomsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/screens/${screenId}`), 'Rooms screen');
}

export async function listRoomListings(
  params: { location?: string; roomType?: string } = {},
): Promise<RoomListing[]> {
  const query = new URLSearchParams();
  if (params.location) query.set('location', params.location);
  if (params.roomType) query.set('roomType', params.roomType);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await parseJsonOrThrow<any>(
    await apiFetch(`/api/v1/rooms/listings${suffix}`),
    'List room listings',
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getRoomDetail(roomId: string): Promise<RoomListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/${roomId}`), 'Room detail');
}

export async function getRoomForOwner(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/${roomId}/owner`), 'Room owner detail');
}

export async function createRoomListing(input: CreateRoomListingInput): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rooms/listings', { method: 'POST', body: JSON.stringify(input) }),
    'Create room listing',
  );
}

export async function updateRoomListing(
  roomId: string,
  input: UpdateRoomListingInput,
): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(input) }),
    'Update room listing',
  );
}

export async function publishRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/publish`, { method: 'PATCH' }),
    'Publish room listing',
  );
}

export async function pauseRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/pause`, { method: 'PATCH' }),
    'Pause room listing',
  );
}

export async function archiveRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/archive`, { method: 'PATCH' }),
    'Archive room listing',
  );
}

export async function deleteRoomListing(roomId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/${roomId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Delete room listing failed: ${response.status}`);
}

export async function getMyListings(): Promise<OwnerRoomListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/my-listings'), 'My listings');
}

export async function getFavorites(): Promise<RoomListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/favorites'), 'Room favorites');
}

export async function saveRoom(roomId: string): Promise<RoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/favorite`, { method: 'POST' }),
    'Save room',
  );
}

export async function unsaveRoom(roomId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/${roomId}/favorite`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Unsave room failed: ${response.status}`);
}

export async function createBooking(
  roomId: string,
  input: CreateBookingInput,
): Promise<RoomBooking> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Create booking',
  );
}

export async function getMyBookings(): Promise<RoomBooking[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/my-bookings'), 'My bookings');
}

export async function listBookings(roomId: string): Promise<RoomBooking[]> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/${roomId}/bookings`), 'List bookings');
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<RoomBooking> {
  const body = JSON.stringify({ status });
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/bookings/${bookingId}/status`, { method: 'PATCH', body }),
    'Update booking status',
  );
}

export async function listSavedSearches(): Promise<SavedSearch[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/saved-searches'), 'Saved searches');
}

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rooms/saved-searches', { method: 'POST', body: JSON.stringify(input) }),
    'Create saved search',
  );
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/saved-searches/${searchId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Delete saved search failed: ${response.status}`);
}

export async function reportRoom(
  roomId: string,
  input: { reason: string; description?: string },
): Promise<RoomReport> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/report`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Report room',
  );
}

export async function getRoomAnalytics(roomId: string): Promise<RoomAnalytics> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/analytics`),
    'Room analytics',
  );
}
