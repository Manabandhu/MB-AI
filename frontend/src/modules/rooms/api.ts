import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type {
  CreateBookingInput,
  CreateRoomListingInput,
  CreateSavedSearchInput,
  OwnerRoomListing,
  RoomAmenityItem,
  RoomAnalytics,
  RoomBooking,
  RoomImage,
  RoomInquiryInput,
  RoomInquiryResponse,
  RoomListing,
  RoomReport,
  SavedSearch,
  UpdateRoomListingInput,
} from './types';

export async function getRoomsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/screens/${screenId}`), 'Rooms screen');
}

export async function getRoomAmenities(): Promise<RoomAmenityItem[]> {
  const res = await apiFetch('/api/v1/rooms/amenities');
  return parseJsonOrThrow(res, 'Room amenities catalog');
}

export async function listRoomListings(
  params: {
    location?: string;
    roomType?: string;
    city?: string;
    state?: string;
    dietaryPreference?: string;
    genderPreference?: string;
    minRent?: number;
    maxRent?: number;
    privateBathOnly?: boolean;
    lat?: number;
    lng?: number;
    radiusMiles?: number;
  } = {},
): Promise<RoomListing[]> {
  const query = new URLSearchParams();
  if (params.location) query.set('location', params.location);
  if (params.roomType) query.set('roomType', params.roomType);
  if (params.city) query.set('city', params.city);
  if (params.state) query.set('state', params.state);
  if (params.dietaryPreference) query.set('dietaryPreference', params.dietaryPreference);
  if (params.genderPreference) query.set('genderPreference', params.genderPreference);
  if (params.minRent != null) query.set('minRent', String(params.minRent));
  if (params.maxRent != null) query.set('maxRent', String(params.maxRent));
  if (params.privateBathOnly != null) query.set('privateBathOnly', String(params.privateBathOnly));
  if (params.lat != null) query.set('lat', String(params.lat));
  if (params.lng != null) query.set('lng', String(params.lng));
  if (params.radiusMiles != null) query.set('radiusMiles', String(params.radiusMiles));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await parseJsonOrThrow<{ content?: RoomListing[] } | RoomListing[]>(
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

export async function getRoomImages(listingId: string): Promise<RoomImage[]> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${listingId}/images`),
    'Room images',
  );
}

export async function addRoomImage(
  listingId: string,
  url: string,
  sortOrder: number = 0,
): Promise<RoomImage> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${listingId}/images`, {
      method: 'POST',
      body: JSON.stringify({ url, sortOrder }),
    }),
    'Add room image',
  );
}

export async function deleteRoomImage(imageId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/images/${imageId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Delete room image failed: ${response.status}`);
}

export async function createBooking(
  listingId: string,
  input: CreateBookingInput,
): Promise<RoomBooking> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${listingId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Create booking',
  );
}

export async function inquireRoom(
  roomId: string,
  input: RoomInquiryInput,
): Promise<RoomInquiryResponse> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/${roomId}/inquire`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Submit room inquiry',
  );
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/saved-searches'), 'Saved searches');
}

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/rooms/saved-searches', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Create saved search',
  );
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/saved-searches/${searchId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Delete saved search failed: ${response.status}`);
}

export async function reportRoom(
  listingId: string,
  reason: string,
  description?: string,
): Promise<RoomReport> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${listingId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    }),
    'Report room',
  );
}

export async function getRoomAnalytics(listingId: string): Promise<RoomAnalytics> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${listingId}/analytics`),
    'Room analytics',
  );
}
