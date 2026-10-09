import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type {
  CreateRoomListingInput,
  OwnerRoomListing,
  RoomAmenityItem,
  RoomInquiryInput,
  RoomInquiryResponse,
  RoomListing,
  UpdateRoomListingInput,
} from './types';

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
    size?: number;
  } = {},
): Promise<RoomListing[]> {
  const query = new URLSearchParams();
  query.set('size', String(params.size ?? 500));
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

export async function deleteRoomListing(roomId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/${roomId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Delete room listing failed: ${response.status}`);
}

export async function getMyListings(): Promise<OwnerRoomListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/my-listings'), 'My listings');
}

export async function getFavorites(): Promise<RoomListing[]> {
  const response = await apiFetch('/api/v1/rooms/favorites');
  if (response.status === 401 || response.status === 403) {
    return [];
  }
  return parseJsonOrThrow(response, 'Room favorites');
}

export async function saveRoom(roomId: string): Promise<RoomListing | null> {
  const response = await apiFetch(`/api/v1/rooms/listings/${roomId}/favorite`, { method: 'POST' });
  if (response.status === 401 || response.status === 403) {
    return null;
  }
  return parseJsonOrThrow(response, 'Save room');
}

export async function unsaveRoom(roomId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/rooms/listings/${roomId}/favorite`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 401 && response.status !== 403) {
    throw new Error(`Unsave room failed: ${response.status}`);
  }
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
