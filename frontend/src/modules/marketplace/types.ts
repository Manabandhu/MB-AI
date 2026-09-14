export type ListingCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type ListingImage = {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

export type MarketplaceListing = {
  id: string;
  ownerId: string;
  category?: ListingCategory;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  negotiable: boolean;
  status: string;
  createdAt: string;
  images?: ListingImage[];
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
