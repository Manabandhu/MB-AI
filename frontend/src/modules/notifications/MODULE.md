# Notifications

Owns the notification inbox, notification detail, notification settings (channels, categories, quiet hours), push
permission and device registration, and push-tap deep links.

## Routes
- `/notifications` -> `NotificationsInboxScreen`
- `/notifications/[id]` -> `NotificationDetailScreen`
- `/notifications/settings` -> `NotificationSettingsScreen` (sign-in required)

## Screens
- `NotificationsInboxScreen` - Server-paged inbox ("Load older"), unread count, mark all read, per-row mark read
  (button everywhere, swipe on phones), pull-to-refresh, real error state with retry.
- `NotificationDetailScreen` - One notification; marks it read when opened; "Open" follows its in-app route.
- `NotificationSettingsScreen` - All-notifications pause, in-app and push channels, category toggles, quiet hours.
  Each change saves at once and is restored if the server refuses it.

## Components
- `NotificationRow`, `notificationVisuals` (icon/tone per type), `SettingRow`, `PushSection`, `QuietHoursSection`.

## Push
- `push.ts`: `requestPermissionAndRegister()` (OS prompt + `POST /devices`), `unregisterThisDevice()`,
  `useOpenPushTaps()` (used in the root layout). `pushRoutes.ts`: only in-app paths are followed.
- Needs `EAS_PROJECT_ID` at build time (see `app.config.js`); web shows that push is a mobile-app feature.

## API (`api.ts`)
- `getNotificationsInbox(page)` -> `GET /api/v1/notifications/inbox?page&size`
- `getUnreadNotificationCount()` -> `GET /api/v1/notifications/unread-count` (badge)
- `getNotificationDetail(id)` -> `GET /api/v1/notifications/{id}` (no side effect)
- `markNotificationRead(id)` -> `POST /api/v1/notifications/{id}/read`
- `markAllNotificationsRead()` -> `POST /api/v1/notifications/read-all`
- `getNotificationSettings()` / `updateNotificationSettings()` -> `GET` / `PATCH /api/v1/notifications/settings`
- `registerPushDevice()` / `removePushDevice()` -> `POST /api/v1/notifications/devices` / `devices/remove`
