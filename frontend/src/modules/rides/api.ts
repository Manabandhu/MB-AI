import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRidesScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rides/screens/${screenId}`);
  if (!response.ok) throw new Error(`Rides screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
