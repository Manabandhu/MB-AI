export type RoomAmenityItem = {
  id: string;
  code: string;
  label: string;
  category: string;
  icon_name?: string;
  is_active: boolean;
  sort_order: number;
};

export type RoomListing = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  price: number;
  roomType: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'REJECTED' | 'RENTED' | 'PUBLISHED';
  broadLocation?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  amenities: string[];
  preferences: string[];
  savedByViewer: boolean;
  dietaryPreference?: string;
  genderPreference?: string;
  bathroomType?: string;
  utilitiesIncluded?: boolean;
  estUtilityMonthly?: number;
  securityDeposit?: number;
  leaseTerm?: string;
  isVerifiedHost?: boolean;
  universityShuttleAccessible?: boolean;
  stateCode?: string;
  county?: string;
};

export type OwnerRoomListing = RoomListing & {
  exactAddress?: string;
};

export type RoomInquiryInput = {
  moveInDate: string;
  stayDurationMonths?: number;
  dietaryLifestyle?: string;
  introMessage: string;
};

export type RoomInquiryResponse = {
  inquiryId: string;
  conversationId: string;
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
  isVerifiedHost?: boolean;
  universityShuttleAccessible?: boolean;
  stateCode?: string;
  county?: string;
};

export type UpdateRoomListingInput = Partial<CreateRoomListingInput> & {
  status?: string;
};
