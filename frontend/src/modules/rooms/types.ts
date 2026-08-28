export type RoomListing = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  price: number;
  roomType: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'REJECTED';
  broadLocation?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  amenities: string[];
  preferences: string[];
  savedByViewer: boolean;
};

export type OwnerRoomListing = RoomListing & {
  exactAddress?: string;
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
