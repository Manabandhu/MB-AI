import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getFoundationScreenContent(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/foundation/screens/${screenId}`);
  if (!response.ok) throw new Error(`Foundation screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
