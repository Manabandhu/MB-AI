# Notifications

Owns the Notifications screen, notification center, preferences, permission education, device registration, deep-link handling, badges, and delivery-state presentation.

## Routes
- `/notifications` -> `NotificationsInboxScreen`
- `/notifications/[id]` -> `NotificationDetailScreen`
- `/notifications/settings` -> `NotificationSettingsScreen`

## Screens
- `NotificationsInboxScreen` - In-app notification inbox with unread counts and module-linked updates.
- `NotificationDetailScreen` - Placeholder for individual notification detail with deep-link handling.
- `NotificationSettingsScreen` - Placeholder for notification preferences (channels, quiet hours).

## API
- `getNotificationsInbox()` -> `GET /api/v1/notifications/inbox`
- `getNotificationDetail(id)` -> `GET /api/v1/notifications/${id}`
- `getNotificationSettings()` -> `GET /api/v1/notifications/settings`
