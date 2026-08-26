import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getJobsScreen(screenId: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/jobs/screens/${screenId}`);
  if (!response.ok) throw new Error(`Jobs screen failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
