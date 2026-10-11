/** Mirrors backend `ListingCategory`. */
export type ListingCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

/** Mirrors backend `ListingImage`. */
export type ListingImage = {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

/** Stored lowercase by the backend; compare with `statusIs`. */
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'removed';

/**
 * Mirrors backend `ListingView`. The seller's id is never exposed; `isMine` tells the viewer whether they own it and
 * `savedByViewer` whether they saved it (both false for signed-out viewers).
 */
export type MarketplaceListing = {
  id: string;
  category: ListingCategory | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  condition: string | null;
  location: string | null;
  negotiable: boolean | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  isMine: boolean;
  savedByViewer: boolean;
  coverImageUrl: string | null;
};

/** Spring `Page<T>` as serialised by the backend (only the fields the app reads). */
export type ListingPage = {
  content: MarketplaceListing[];
  totalElements: number;
  totalPages: number;
  number: number;
  last?: boolean;
};

export type ListingFilters = {
  q?: string;
  categoryId?: string | null;
  condition?: string | null;
  maxPrice?: number | null;
  includeClosed?: boolean;
};

export type CreateListingInput = {
  categoryId: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  condition?: string;
  location?: string;
  negotiable?: boolean;
};

/** PATCH body: omitted fields are unchanged; `''` clears description, location and condition. */
export type UpdateListingInput = {
  categoryId?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  condition?: string;
  location?: string;
  negotiable?: boolean;
  status?: ListingStatus;
};

/** Mirrors backend `ListingFavorite`. */
export type ListingFavorite = {
  id: string;
  listingId: string;
  userId: string;
  createdAt: string;
};

export type ContactSellerResult = { conversationId: string; created: boolean };

export type ReportListingInput = { reason: string; description?: string };
