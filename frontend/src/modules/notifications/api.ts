import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  read: boolean;
};

export async function getNotificationsInbox(): Promise<{ items: NotificationItem[] }> {
  return parseJsonOrThrow(await apiFetch('/api/v1/notifications/inbox'), 'Notifications inbox');
}

export async function getNotificationDetail(id: string): Promise<NotificationItem> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}`),
    'Notification detail',
  );
}

export async function getNotificationSettings(): Promise<{ preferences: Record<string, boolean> }> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/settings'),
    'Notification settings',
  );
}

export async function updateNotificationSettings(
  preferences: Record<string, boolean>,
): Promise<{ preferences: Record<string, boolean> }> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    }),
    'Update notification settings',
  );
}
