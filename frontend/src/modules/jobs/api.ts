import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getJobsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/jobs/screens/${screenId}`), 'Jobs screen');
}
