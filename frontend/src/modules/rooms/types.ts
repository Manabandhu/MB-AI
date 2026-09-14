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

export type RoomBooking = {
  id: string;
  listingId: string;
  requesterId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  createdAt: string;
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

export type CreateBookingInput = {
  message: string;
};

export type SavedSearch = {
  id: string;
  userId: string;
  name: string;
  query?: string;
  city?: string;
  broadLocation?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: string;
  furnished?: boolean;
  alertsEnabled: boolean;
  createdAt: string;
};

export type CreateSavedSearchInput = {
  name: string;
  query?: string;
  city?: string;
  broadLocation?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: string;
  furnished?: boolean;
  alertsEnabled?: boolean;
};

export type RoomReport = {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type RoomAnalytics = {
  views: number;
  saves: number;
  inquiries: number;
};

export type RoomImage = {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};
