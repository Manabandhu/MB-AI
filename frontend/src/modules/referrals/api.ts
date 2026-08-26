import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getReferralsScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/referrals/screens/${screenId}`);
  if (!response.ok) throw new Error(`Referrals screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
