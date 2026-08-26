import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getMarketplaceScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/marketplace/screens/${screenId}`);
  if (!response.ok) throw new Error(`Marketplace screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
