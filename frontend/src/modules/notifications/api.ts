import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  /** Notification type (RIDE, CHAT, …). */
  meta: string;
  read: boolean;
  route?: string | null;
  createdAt?: string;
};

export type NotificationInboxPage = {
  items: NotificationItem[];
  page: number;
  hasMore: boolean;
  unreadCount: number;
};

/** Channel and category toggles plus quiet hours; see `NotificationsContentService` on the backend. */
export type NotificationPreferences = Record<string, boolean | string>;

export const INBOX_PAGE_SIZE = 20;

export async function getNotificationsInbox(page = 0): Promise<NotificationInboxPage> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/notifications/inbox?page=${page}&size=${INBOX_PAGE_SIZE}`),
    'Notifications inbox',
  );
}

export async function getUnreadNotificationCount(): Promise<number> {
  return parseJsonOrThrow(await apiFetch('/api/v1/notifications/unread-count'), 'Unread count');
}

/** Reads a notification without changing it; call {@link markNotificationRead} to mark it read. */
export async function getNotificationDetail(id: string): Promise<NotificationItem> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}`),
    'Notification detail',
  );
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
    'Mark notification read',
  );
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/read-all', { method: 'POST' }),
    'Mark all read',
  );
}

export async function getNotificationSettings(): Promise<{ preferences: NotificationPreferences }> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/settings'),
    'Notification settings',
  );
}

export async function updateNotificationSettings(
  preferences: NotificationPreferences,
): Promise<{ preferences: NotificationPreferences }> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    }),
    'Update notification settings',
  );
}

export async function registerPushDevice(token: string, platform: 'ios' | 'android') {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/notifications/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
    'Register device',
  );
}

export async function removePushDevice(token: string): Promise<void> {
  const response = await apiFetch('/api/v1/notifications/devices/remove', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!response.ok && response.status !== 404) throw new Error('Could not remove this device');
}

/** Query keys shared by the inbox, the unread badge, and anything that changes read state. */
export const notificationKeys = {
  inbox: ['notifications', 'inbox'] as const,
  unread: ['notifications', 'unread-count'] as const,
  detail: (id: string) => ['notifications', 'detail', id] as const,
  settings: ['notifications', 'settings'] as const,
};
