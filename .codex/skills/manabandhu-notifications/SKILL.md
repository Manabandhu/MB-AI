---
name: manabandhu-notifications
description: Maintain ManaBandhu notifications across in-app inbox, mobile push, web push, email, and SMS, including preferences, consent, localization, quiet hours, templates, retries, and delivery state. Use for any notification-producing or notification-delivery change.
---

# Notifications

Frontend notification center, preferences, permissions, badges, and deep-link behavior belong to `frontend/src/modules/notifications`.

The module owns the foundation-level Notifications screen even when it is linked from the global app shell.
The first-batch inbox route `/notifications` uses `frontend/src/modules/notifications/screens/NotificationsInboxScreen.tsx` and the read-only demo endpoint `GET /api/v1/notifications/inbox`.

1. Read `platform/notifications/MODULE.md` and the AsyncAPI contract.
2. Emit versioned, idempotent notification requests; never call providers from business transactions.
3. Evaluate authorization, consent, preference, locale, timezone, quiet hours, urgency, deduplication, and rate limits.
4. Track requested, accepted, delivered, opened, failed, and suppressed states without storing secrets.
5. Design in-app and push now; keep email/SMS adapters explicit. Preserve future watch delivery compatibility.
6. Test duplicate events, retries, disabled channels, quiet hours, and provider failure.
7. Update this skill when channels, event fields, providers, policies, or paths change.
8. Current frontend implementation: inbox route `/notifications` renders `NotificationsInboxScreen` from `frontend/src/modules/notifications/screens/`. Additional screens include `NotificationDetailScreen` and `NotificationSettingsScreen`. API client in `frontend/src/modules/notifications/api.ts` uses read-only demo endpoints.
9. Backend: REST and GraphQL APIs implemented under `/api/v1/notifications` with notifications, preferences, device registrations, AsyncAPI `notificationRequested` producer, and Flyway migration V13.
10. Recent fixes: `NotificationsInboxScreen` import grouping was cleaned up and inline JSX props were expanded for readability without changing behavior.
