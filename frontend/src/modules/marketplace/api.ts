import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type { ListingCategory, ListingImage, MarketplaceListing } from './types';

export async function getMarketplaceScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/screens/${screenId}`),
    'Marketplace screen',
  );
}

export async function listMarketplaceListings(): Promise<MarketplaceListing[]> {
  const response = await apiFetch('/api/v1/marketplace/listings');
  if (!response.ok) {
    throw new Error(`Failed to load marketplace listings: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.content ?? [];
}

export async function getMarketplaceListing(listingId: string): Promise<MarketplaceListing> {
  const response = await apiFetch(`/api/v1/marketplace/listings/${listingId}`);
  if (!response.ok) {
    throw new Error(`Failed to load marketplace listing: ${response.status}`);
  }
  return response.json();
}

export async function getMarketplaceListingImages(listingId: string): Promise<ListingImage[]> {
  const response = await apiFetch(`/api/v1/marketplace/listings/${listingId}/images`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function listMarketplaceCategories(): Promise<ListingCategory[]> {
  const response = await apiFetch('/api/v1/marketplace/categories');
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function createMarketplaceListing(
  input: import('./types').CreateListingInput,
): Promise<MarketplaceListing> {
  const response = await apiFetch('/api/v1/marketplace/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      currency: input.currency ?? 'USD',
      negotiable: input.negotiable ?? true,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create marketplace listing (${response.status}): ${errText}`);
  }
  return response.json();
}
