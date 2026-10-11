import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type {
  ContactSellerResult,
  CreateListingInput,
  ListingCategory,
  ListingFavorite,
  ListingFilters,
  ListingImage,
  ListingPage,
  MarketplaceListing,
  ReportListingInput,
  UpdateListingInput,
} from './types';
import { listingQuery, PAGE_SIZE } from './utils/listingRules';

// Every call here throws on failure (`parseJsonOrThrow` / `expectOk`); screens show the error with a retry.

async function expectOk(response: Response, label: string) {
  if (response.ok) return;
  // Reuse the shared error parsing (status + server detail) without expecting a body on success.
  await parseJsonOrThrow<unknown>(response, label);
}

/** One page of public listings, newest first. Search, filters and the price ceiling run on the server. */
export async function searchMarketplaceListings(
  filters: ListingFilters = {},
  page = 0,
  size = PAGE_SIZE,
): Promise<ListingPage> {
  const data = await parseJsonOrThrow<Partial<ListingPage>>(
    await apiFetch(`/api/v1/marketplace/listings?${listingQuery(filters, page, size)}`),
    'Marketplace listings',
  );
  const content = data.content ?? [];
  return {
    content,
    totalElements: data.totalElements ?? content.length,
    totalPages: data.totalPages ?? 1,
    number: data.number ?? page,
    last: data.last,
  };
}

/** First page of active listings (used by global search). */
export async function listMarketplaceListings(
  filters: ListingFilters = {},
): Promise<MarketplaceListing[]> {
  return (await searchMarketplaceListings(filters, 0, 50)).content;
}

export async function getMarketplaceListing(listingId: string): Promise<MarketplaceListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}`),
    'Marketplace listing',
  );
}

/** The caller's own listings in every status (newest 200). */
export async function getMyListings(): Promise<MarketplaceListing[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/marketplace/listings/mine'), 'My listings');
}

export async function getMarketplaceListingImages(listingId: string): Promise<ListingImage[]> {
  const images = await parseJsonOrThrow<ListingImage[]>(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/images`),
    'Listing photos',
  );
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listMarketplaceCategories(): Promise<ListingCategory[]> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/marketplace/categories'),
    'Marketplace categories',
  );
}

export async function createMarketplaceListing(
  input: CreateListingInput,
): Promise<MarketplaceListing> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify({ ...input, currency: input.currency ?? 'USD' }),
    }),
    'Create listing',
  );
}

/** Partial update, including owner status changes (active ↔ reserved → sold → relist). */
export async function updateListing(
  listingId: string,
  input: UpdateListingInput,
): Promise<MarketplaceListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
    'Update listing',
  );
}

/** Deletes the listing, its photos and their stored files. */
export async function deleteListing(listingId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}`, {
      method: 'DELETE',
    }),
    'Delete listing',
  );
}

/** `url` must be exactly what `useImageUpload('marketplace')` returned. */
export async function addListingImage(
  listingId: string,
  input: { url: string; sortOrder: number },
): Promise<ListingImage> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/images`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Attach photo',
  );
}

export async function deleteListingImage(imageId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/marketplace/images/${encodeURIComponent(imageId)}`, {
      method: 'DELETE',
    }),
    'Remove photo',
  );
}

/** Opens (or reuses) a direct chat with the seller about this listing. */
export async function contactSeller(listingId: string): Promise<ContactSellerResult> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/contact`, {
      method: 'POST',
    }),
    'Contact seller',
  );
}

export async function reportListing(listingId: string, input: ReportListingInput): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/report`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'Report listing',
  );
}

/** The signed-in member's saved listings as full listings. */
export async function getSavedListings(): Promise<MarketplaceListing[]> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/marketplace/favorites/listings'),
    'Saved listings',
  );
}

/** Raw favorite rows; prefer `getSavedListings` for display. */
export async function listMarketplaceFavorites(): Promise<ListingFavorite[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/marketplace/favorites'), 'Saved listings');
}

export async function favoriteMarketplaceListing(listingId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/favorite`, {
      method: 'POST',
    }),
    'Save listing',
  );
}

export async function unfavoriteMarketplaceListing(listingId: string): Promise<void> {
  await expectOk(
    await apiFetch(`/api/v1/marketplace/listings/${encodeURIComponent(listingId)}/favorite`, {
      method: 'DELETE',
    }),
    'Remove saved listing',
  );
}
