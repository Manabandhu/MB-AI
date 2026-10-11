---
name: manabandhu-notifications
description: Maintain ManaBandhu notifications across in-app inbox, mobile push, web push, email, and SMS, including preferences, consent, localization, quiet hours, templates, retries, and delivery state. Use for any notification-producing or notification-delivery change.
---

# Notifications

Frontend notification center, preferences, permissions, badges, and deep-link behavior belong to `frontend/src/modules/notifications`.

The module owns the foundation-level Notifications screen even when it is linked from the global app shell.
The first-batch inbox route `/notifications` uses `frontend/src/modules/notifications/screens/NotificationsInboxScreen.tsx` and the authenticated per-user endpoint `GET /api/v1/notifications/inbox`.

1. Read `platform/notifications/MODULE.md` and the AsyncAPI contract.
2. Emit versioned, idempotent notification requests; never call providers from business transactions.
3. Evaluate authorization, consent, preference, locale, timezone, quiet hours, urgency, deduplication, and rate limits.
4. Track requested, accepted, delivered, opened, failed, and suppressed states without storing secrets.
5. Design in-app and push now; keep email/SMS adapters explicit. Preserve future watch delivery compatibility.
6. Test duplicate events, retries, disabled channels, quiet hours, and provider failure.
7. Update this skill when channels, event fields, providers, policies, or paths change.
8. Current frontend implementation: inbox route `/notifications` renders `NotificationsInboxScreen` from `frontend/src/modules/notifications/screens/`. Additional screens include `NotificationDetailScreen` and `NotificationSettingsScreen`. API client in `frontend/src/modules/notifications/api.ts` reads the signed-in user's notifications.
9. Backend: REST and GraphQL APIs implemented under `/api/v1/notifications` with notifications, preferences, device registrations, AsyncAPI `notificationRequested` producer, and Flyway migration V13.
10. Recent fixes: `NotificationsInboxScreen` import grouping was cleaned up and inline JSX props were expanded for readability without changing behavior.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.
- Recent inbox fallback fix: `NotificationsInboxScreen` `useQuery` now uses direct API query and displays standard `EmptyState` when inbox is clear, removing `fallbackNotifications`.
- Notification Detail & Settings wiring: `NotificationDetailScreen` is wired to `getNotificationDetail` with `LoadingState` and `ErrorState`; `NotificationSettingsScreen` is wired to `getNotificationSettings`.
- Notifications Inbox Stitch overhaul: modernized `NotificationsInboxScreen.tsx` with premium Stitch notification cards, unread saffron indicator badges, category filter tabs ("All", "Unread"), contextual category vector icons, search input, and direct navigation to notification details and settings; added `isCompact` support for narrow screens.
- Unified design system standardization: Standardized `NotificationsInboxScreen.tsx` with the single ManaBandhu Modern Vibrant design system (`#431ebe` Royal Indigo, `#00696b` Teal, `#ff7e33` Sunset Orange, `#faf8ff` surface).
- Repo-Wide Code Review & Defect Remediation: Audited `NotificationsInboxScreen.tsx` for touch targets compliance, verified unread badge cache synchronization, and ensured all icon actions have `accessibilityRole` and `accessibilityLabel`.
- Pull-to-refresh: `NotificationsInboxScreen` implements `RefreshControl` with query refetching when users swipe down on the notifications list.
- Security & correctness hardening (2026-10): `GET/PATCH /api/v1/notifications/settings` are per user (stored in `notification_settings`, V31) and require a JWT; unknown keys are ignored. No notification route is public. Marking read checks ownership; creating notifications by hand is admin-only. `NotificationDispatcherService` claims batches of 50 with `FOR UPDATE SKIP LOCKED`, uses 5s/10s HTTP timeouts, and leaves rows undispatched when no push provider is configured instead of silently marking them sent.
- Real inbox (2026-10 review): `GET /api/v1/notifications/inbox` requires a JWT and returns `NotificationInbox(items)` built from the caller's latest 100 notifications (`NotificationDetail`: `id`, `title`, `body`, `meta`, `read`, `route`, `createdAt`). `GET /api/v1/notifications/{id}` marks the caller's own notification read and returns it. The demo content in `NotificationsContentService` and `DEFAULT_NOTIFICATIONS` in the inbox screen were removed; an empty inbox shows `EmptyState`.
- No fake success (2026-10): `NotificationSettingsScreen` renders toggles only after the user's saved preferences load (loading/error states otherwise); a failed save reverts and says so instead of "Saved locally"; the unsaved delivery-pace picker was removed; the "Push & In-App Enabled" pill shows only when both are on.
- Push retries (2026-10, V32): failed pushes increment `dispatch_attempts` and set `next_dispatch_at` with 2/4/8/16-minute backoff; `claimUndispatched` skips rows that are backing off or have failed 5 times, so poison rows cannot pin the oldest-first batch.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.

## Notifications platform (2026-10-11)

- **Producers:** `NotificationPublisher.publish/publishAll(recipient, actor, type, title, body, route)` is the only way modules create notifications.
  - It writes after the caller's transaction commits, in its own transaction, so a failure never undoes the action.
  - It skips the actor and respects the recipient's `allNotifications`, `inApp` and category toggle.
  - Category per type: RIDE `rideAlerts`, ROOM `housingAlerts`, CHAT `chatMessages`, EXPENSE `expenseAlerts`, REFERRAL `referralAlerts`, JOB `jobAlerts`, EVENT/COMMUNITY `communityEvents`, SAFETY `safetyAlerts`.
  - Hooks:
    - Seat request created (driver) and accepted/declined/withdrawn (`RideRequestService`).
    - Room inquiry (`RoomInquiryService`, host).
    - User-sent chat message (`MessageService.sendAs`, other participants; the text is never copied into the notification).
    - Expense added (`ExpenseService`, other members).
    - Referral status change (`ReferralService`, recipient when set).
    - Event RSVP going/interested (`EventsService.attend`, organiser).
    - Job application created/status changed (`JobApplicationService`).
- **One settings store:** `notification_settings.preferences` jsonb (`NotificationsContentService`).
  - Keys: channels (`inApp`, `push`, `email`, `sms`), the categories above, and `quietHours`/`quietStart`/`quietEnd` ("HH:mm")/`timeZone` (IANA).
  - Invalid values are a 400, never silently dropped.
  - `GET/POST /notifications/preferences` are views over the same channel keys.
  - The `NotificationPreference` entity was removed; the old `notification_preferences` table is unused.
- **Inbox:**
  - `GET /inbox?page&size` is paged in SQL (size ≤ 50) and returns `{items, page, hasMore, unreadCount}`.
  - `GET /{id}` is recipient-only and has no side effect.
  - `POST /{id}/read`, `POST /read-all` and `GET /unread-count`.
- **Push:**
  - `device_registrations` (V13; V35 dedupes and adds a unique token index, RLS on) stores Expo push tokens.
  - `POST /devices {token, platform}` validates the Expo token format and moves a token to the latest signed-in account. `POST /devices/remove {token}` is owner only (others get 404).
  - `NotificationDispatcherService` sends through `https://exp.host/--/api/v2/push/send` when `PUSH_NOTIFICATIONS_ENABLED=true` (optional `EXPO_ACCESS_TOKEN`).
  - Dispatcher decisions: push off → closed without sending; quiet hours → `next_dispatch_at` = end of quiet hours; no device → closed; `DeviceNotRegistered` tickets disable the token.
  - The Supabase edge-function path was removed.
