import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getReferralsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/referrals/screens/${screenId}`),
    'Referrals screen',
  );
}
