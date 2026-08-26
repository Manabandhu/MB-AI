import { apiFetch } from '@/lib/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export async function getNotificationsInbox(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/notifications/inbox');
  if (!response.ok) throw new Error(`Notifications inbox failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getNotificationDetail(id: string): Promise<CatalogScreenContent> {
  const response = await apiFetch(`/api/v1/notifications/${id}`);
  if (!response.ok) throw new Error(`Notification detail failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}

export async function getNotificationSettings(): Promise<CatalogScreenContent> {
  const response = await apiFetch('/api/v1/notifications/settings');
  if (!response.ok) throw new Error(`Notification settings failed: ${response.status}`);
  return response.json() as Promise<CatalogScreenContent>;
}
