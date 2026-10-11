/** Amenity catalog row from `GET /api/v1/rooms/amenities` (Jackson camelCase). */
export type RoomAmenityItem = {
  id: string;
  code: string;
  label: string;
  category: string;
  iconName?: string | null;
  active: boolean;
  sortOrder: number;
};

/** Listing statuses as stored by the backend (lowercase). Compare with `statusIs`, never with `===` on raw input. */
export type RoomListingStatus = 'draft' | 'active' | 'paused' | 'archived' | 'rejected' | 'rented';

/** Public listing (`RoomListingResponse`). No owner id, no exact address; coordinates are rounded to ~1 km. */
export type RoomListing = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  roomType: string;
  status: RoomListingStatus | string;
  broadLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
  amenities: string[];
  preferences: string[];
  savedByViewer: boolean;
  /** True when the signed-in viewer owns this listing. */
  isOwner: boolean;
  coverImageUrl?: string | null;
  dietaryPreference?: string | null;
  genderPreference?: string | null;
  bathroomType?: string | null;
  utilitiesIncluded?: boolean | null;
  estUtilityMonthly?: number | null;
  securityDeposit?: number | null;
  leaseTerm?: string | null;
  isVerifiedHost?: boolean | null;
  universityShuttleAccessible?: boolean | null;
  stateCode?: string | null;
  county?: string | null;
};

/** Owner/admin view (`OwnerRoomListingResponse`): exact address and coordinates included. */
export type OwnerRoomListing = Omit<RoomListing, 'isOwner' | 'savedByViewer'> & {
  ownerId: string;
  exactAddress?: string | null;
  savedByViewer?: boolean;
};

export type RoomImage = {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

export type RoomInquiryInput = {
  moveInDate: string;
  /** null means "flexible". Otherwise 1–36. */
  stayDurationMonths: number | null;
  dietaryLifestyle?: string;
  introMessage: string;
};

export type RoomInquiryResponse = {
  inquiryId: string;
  conversationId: string;
};

export type RoomReportInput = {
  reason: string;
  description?: string;
};

export type CreateRoomListingInput = {
  title: string;
  description?: string;
  price: number;
  roomType: string;
  broadLocation: string;
  exactAddress?: string;
  latitude?: number;
  longitude?: number;
  dietaryPreference?: string;
  genderPreference?: string;
  bathroomType?: string;
  utilitiesIncluded?: boolean;
  estUtilityMonthly?: number;
  securityDeposit?: number;
  leaseTerm?: string;
  universityShuttleAccessible?: boolean;
  stateCode?: string;
  county?: string;
  /** ≤30 entries, each ≤80 chars. On update the set is replaced. */
  amenities?: string[];
};

export type UpdateRoomListingInput = Partial<CreateRoomListingInput> & {
  status?: RoomListingStatus;
};

/** Case-insensitive status check (older rows and clients used uppercase). */
export function statusIs(status: string | null | undefined, ...values: RoomListingStatus[]) {
  const normalized = (status ?? '').toLowerCase();
  return values.some((value) => value === normalized);
}
