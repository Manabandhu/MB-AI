import { apiFetch } from '@/lib/api';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  read: boolean;
};

export async function getNotificationsInbox(): Promise<{ items: NotificationItem[] }> {
  const response = await apiFetch('/api/v1/notifications/inbox');
  if (!response.ok) throw new Error(`Notifications inbox failed: ${response.status}`);
  return response.json() as Promise<{ items: NotificationItem[] }>;
}

export async function getNotificationDetail(id: string): Promise<NotificationItem> {
  const response = await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`Notification detail failed: ${response.status}`);
  return response.json() as Promise<NotificationItem>;
}

export async function getNotificationSettings(): Promise<{ preferences: Record<string, boolean> }> {
  const response = await apiFetch('/api/v1/notifications/settings');
  if (!response.ok) throw new Error(`Notification settings failed: ${response.status}`);
  return response.json() as Promise<{ preferences: Record<string, boolean> }>;
}
