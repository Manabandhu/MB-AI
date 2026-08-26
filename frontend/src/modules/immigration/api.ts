import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getImmigrationScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/immigration/screens/${screenId}`);
  if (!response.ok) throw new Error(`Immigration screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
