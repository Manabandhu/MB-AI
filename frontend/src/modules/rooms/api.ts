import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type {
  CreateRoomListingInput,
  OwnerRoomListing,
  RoomAmenityItem,
  RoomImage,
  RoomInquiryInput,
  RoomInquiryResponse,
  RoomListing,
  RoomReportInput,
  UpdateRoomListingInput,
} from './types';

/** Throws an error carrying the server detail when a call without a JSON body failed. */
async function expectOk(response: Response, label: string): Promise<void> {
  if (response.ok) return;
  await parseJsonOrThrow(response, label);
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
  return parseJsonOrThrow(await apiFetch(`/api/v1/rooms/listings/${roomId}`), 'Room detail');
}

export async function getRoomForOwner(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/owner`),
    'Room owner detail',
  );
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
    await apiFetch(`/api/v1/rooms/listings/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
    'Update room listing',
  );
}

/** draft | paused | rented → active. */
export async function publishRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/publish`, { method: 'PATCH' }),
    'Publish room listing',
  );
}

export async function pauseRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/pause`, { method: 'PATCH' }),
    'Pause room listing',
  );
}

export async function archiveRoomListing(roomId: string): Promise<OwnerRoomListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/archive`, { method: 'PATCH' }),
    'Archive room listing',
  );
}

/** active | paused → rented. */
export async function markRoomRented(roomId: string): Promise<OwnerRoomListing> {
  return updateRoomListing(roomId, { status: 'rented' });
}

export async function deleteRoomListing(roomId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/rooms/listings/${roomId}`, { method: 'DELETE' }),
    'Delete room listing',
  );
}

/** Owner's listings, newest first (at most 200). */
export async function getMyListings(): Promise<OwnerRoomListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/my-listings'), 'My listings');
}

/** The caller's saved rooms (at most 200). Auth failures throw; they are never turned into an empty list. */
export async function getFavorites(): Promise<RoomListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/rooms/favorites'), 'Saved rooms');
}

export async function saveRoom(roomId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/favorite`, { method: 'POST' }),
    'Save room',
  );
}

export async function unsaveRoom(roomId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/favorite`, { method: 'DELETE' }),
    'Unsave room',
  );
}

/** Repeat inquiries for the same room return the existing conversation. */
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

/** Photos in display order. Public for active/paused listings; the owner sees any status. */
export async function listRoomImages(roomId: string): Promise<RoomImage[]> {
  const images = await parseJsonOrThrow<RoomImage[]>(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/images`),
    'Room photos',
  );
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Attaches an uploaded photo (a `rooms` bucket URL from `useImageUpload('rooms')`). Owner only, max 20. */
export async function addRoomImage(
  roomId: string,
  input: { url: string; sortOrder: number },
): Promise<RoomImage> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/images`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Attach room photo',
  );
}

export async function deleteRoomImage(imageId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/rooms/images/${imageId}`, { method: 'DELETE' }),
    'Remove room photo',
  );
}

export async function reportRoom(roomId: string, input: RoomReportInput): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/rooms/listings/${roomId}/report`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Report listing',
  );
}
