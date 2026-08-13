import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getRoomsScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/rooms/screens/${screenId}`);
  if (!response.ok) throw new Error(`Rooms screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
