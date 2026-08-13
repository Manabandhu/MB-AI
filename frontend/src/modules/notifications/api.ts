import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getNotificationsInbox(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/notifications/inbox');
  if (!response.ok) throw new Error(`Notifications inbox failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
