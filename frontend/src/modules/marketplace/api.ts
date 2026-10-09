import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type {
  CreateListingInput,
  ListingCategory,
  ListingImage,
  MarketplaceListing,
} from './types';

export async function listMarketplaceListings(): Promise<MarketplaceListing[]> {
  const data = await parseJsonOrThrow<{ content?: MarketplaceListing[] } | MarketplaceListing[]>(
    await apiFetch('/api/v1/marketplace/listings'),
    'Marketplace listings',
  );
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}

export async function getMarketplaceListing(listingId: string): Promise<MarketplaceListing> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${listingId}`),
    'Marketplace listing detail',
  );
}

export async function getMarketplaceListingImages(listingId: string): Promise<ListingImage[]> {
  try {
    return await parseJsonOrThrow<ListingImage[]>(
      await apiFetch(`/api/v1/marketplace/listings/${listingId}/images`),
      'Marketplace listing images',
    );
  } catch {
    return [];
  }
}

export async function listMarketplaceCategories(): Promise<ListingCategory[]> {
  try {
    return await parseJsonOrThrow<ListingCategory[]>(
      await apiFetch('/api/v1/marketplace/categories'),
      'Marketplace categories',
    );
  } catch {
    return [];
  }
}

export async function createMarketplaceListing(
  input: CreateListingInput,
): Promise<MarketplaceListing> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        currency: input.currency ?? 'USD',
        negotiable: input.negotiable ?? true,
      }),
    }),
    'Create marketplace listing',
  );
}

/** Mirrors backend `ListingFavorite`. */
export type ListingFavorite = {
  id: string;
  listingId: string;
  userId: string;
  createdAt: string;
};

export async function listMarketplaceFavorites(): Promise<ListingFavorite[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/marketplace/favorites'), 'Marketplace favorites');
}

export async function favoriteMarketplaceListing(listingId: string): Promise<ListingFavorite> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/marketplace/listings/${listingId}/favorite`, { method: 'POST' }),
    'Save listing',
  );
}

export async function unfavoriteMarketplaceListing(listingId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/marketplace/listings/${listingId}/favorite`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Remove saved listing failed: ${response.status}`);
}
