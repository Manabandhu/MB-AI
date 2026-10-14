---
name: manabandhu-admin
description: Maintain ManaBandhu super admin dashboard, user management, reports, moderation across rooms/rides/community/jobs/events, audit log, and typed automation API client. Use for changes under the frontend admin module or admin automation control plane.
---

# Admin

## Module Purpose and Ownership

Owns Dashboard, Users, Reports, Rooms/Rides/Community/Jobs/Events Moderation, Audit Log, and the typed automation API client. It never stores infrastructure credentials or executes arbitrary commands.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/admin` | `AdminDashboardScreen` | admin | loading, error |
| `/admin/users` | `AdminUsersScreen` | admin | loading, empty, error |
| `/admin/reports` | `AdminReportsScreen` | admin | loading, empty, error |
| `/admin/rooms` | `AdminRoomsScreen` | admin | loading, empty, error |
| `/admin/rides` | `AdminRidesScreen` | admin | loading, empty, error |
| `/admin/community` | `AdminCommunityScreen` | admin | loading, empty, error |
| `/admin/jobs` | `AdminJobsScreen` | admin | loading, empty, error |
| `/admin/events` | `AdminEventsScreen` | admin | loading, empty, error |
| `/admin/audit-log` | `AdminAuditLogScreen` | admin | loading, empty, error |

## Component Inventory

- `AdminDashboardScreen` - admin overview with metric cards and quick links
- `AdminUsersScreen` - manage users with search, filter, and status actions
- `AdminReportsScreen` - view and manage reports with status badges
- `AdminRoomsScreen` - moderate room listings
- `AdminRidesScreen` - moderate rides
- `AdminCommunityScreen` - moderate community content
- `AdminJobsScreen` - moderate job postings
- `AdminEventsScreen` - moderate events
- `AdminAuditLogScreen` - system audit log
- Shared: `ScreenShell`, `MetricCard`, `SectionHeader`, `AppButton`, `ListScreen`, `TabBar`, `SearchBar`, `FilterBar`, `Modal`, `SwipeAction`, `CatalogScreen`, `ErrorState`

## API Surface

- `listAutomationOperations()` -> `GET /api/v1/admin/automations`
- `executeAutomation(operationId, input)` -> `POST /api/v1/admin/automations/{operationId}/executions`
- `listUsers()` -> `GET /api/v1/admin/users`
- `getUser(id)` -> `GET /api/v1/admin/users/{id}`
- `updateUserStatus(input)` -> `PATCH /api/v1/admin/users/{id}/status`
- `listReports()` -> `GET /api/v1/admin/reports`
- `resolveReport(id)` -> `POST /api/v1/admin/reports/{id}/resolve`
- `listAdminRooms()` -> `GET /api/v1/admin/rooms`
- `listAdminRides()` -> `GET /api/v1/admin/rides`
- `listAdminCommunityPosts()` -> `GET /api/v1/admin/community`
- `listAdminJobs()` -> `GET /api/v1/admin/jobs`
- `listAdminEvents()` -> `GET /api/v1/admin/events`
- `listAuditLog()` -> `GET /api/v1/admin/audit-log`

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` / skeleton while admin data loads
- **Empty**: `EmptyState` when no reports, users, or moderation items exist
- **Error**: `ErrorState` with retry action
- **Success**: confirmation after resolve/update actions
- **Offline**: offline banner with cached data
- **Permission**: admin routes are gated by verified server-side JWT claims

## Navigation Actions and Cross-Module Links

- Dashboard quick cards navigate to Users, Reports, Rooms, Rides, Community, Jobs, Events, Audit Log
- Moderation screens deep-link to module detail routes (`/rooms/[roomId]`, `/rides/[rideId]`, etc.)
- Back navigation to dashboard from all admin screens

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/admin/` are thin wrappers
- Uses `useQuery` for all admin data fetching
- Admin mutations use `useMutation` with query invalidation
- All privileged actions are enforced server-side; client derives authorization from verified JWT claims
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Tables and lists support screen readers
- Single column on compact, adaptive width on larger screens

## Current Implementation Status

- **Partial**: Dashboard and all list screens (users, reports, rooms, rides, community, jobs, events, audit log) are UI-complete. Moderation actions and automation executions are placeholders pending backend wiring. Authorization is not yet enforced client-side beyond route gating.
- Rides moderation is backed by `GET /api/v1/admin/rides` returning ride projections with `from`, `to`, `driverId`, `status`, `reported`, and `createdAt`.
- Recent fixes: admin detail navigation uses typed `Href` casts, and screen JSX formatting was normalized for readability.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent admin guard changes: added `useRequireAuth('/sign-in')` to all admin routes (`/admin`, `/admin/users`, `/admin/reports`, `/admin/rooms`, `/admin/rides`, `/admin/community`, `/admin/jobs`, `/admin/events`, `/admin/audit-log`).
- Fallback cleanup: deleted `adminFallbacks.ts` and removed fallback demo data from `AdminDashboardScreen`, `AdminUsersScreen`, `AdminReportsScreen`, `AdminRoomsScreen`, `AdminRidesScreen`, `AdminCommunityScreen`, `AdminJobsScreen`, `AdminEventsScreen`, and `AdminAuditLogScreen` in favor of live backend endpoints, loading states, and error/empty states.
- Admin dashboard modernization & safety reports backend: Aligned `AdminDashboardScreen.tsx` to the unified design system (`#431ebe`, `#00696b`, `#ff7e33`), added KPI telemetry cards, priority moderation tabs, and wired report actions to the new `AdminReportsController` endpoints (`GET /api/v1/admin/reports`, `POST /api/v1/admin/reports/{id}/resolve`).
- Repo-Wide Code Review & Defect Remediation: Audited admin screens for responsive layouts across mobile and desktop, added `hitSlop` on icon buttons and action triggers, and verified loading and empty state lifecycles across all moderation screens.
- Security & correctness hardening (2026-10): Admin screens now have backing endpoints for users, rooms, jobs, events, community and the audit log; the reports screen compares report status case-insensitively so the Resolve action appears for `OPEN` reports.
- No invented numbers (2026-10): `AdminDashboardScreen` KPIs are counts from the admin list endpoints (open reports, flagged listings, users, listings) and the priority queue lists up to 5 open reports with a real Resolve action; the hard-coded KPIs, queue tabs and sample moderation cards were removed. See `manabandhu-super-admin`.
- Cleanup: removed the unused `SuperAdminScreen.tsx`; added the `/admin/automations` route (`AdminAutomationsScreen`) linked from the dashboard and backed by `/api/v1/admin/automations`.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 hardening (2026-10-10): see `manabandhu-super-admin`. Status changes refuse self-suspension, super admins, and admins unless the caller is a super admin; `AdminUsersScreen` alerts the server's reason.
- Admin console P0/P1 (2026-10-13):
  - **New routes:** `/admin/users/[userId]` (`AdminUserDetailScreen`, `GET /api/v1/admin/users/{id}` via `getAdminUser`) and `/admin/reports/[reportId]` (`AdminReportDetailScreen`; the backend has no single-report GET, so it reads the cached `['admin','reports']` list and shows "Report not found" when absent).
  - **Actions:** `hooks.ts` `useUserStatusAction` (suspend = red confirm, reactivate = normal confirm) and `useResolveReportAction` (red confirm) show errors with shared `showError`, update/invalidate `['admin','users'|'user'|'reports'|'audit-log']`, and expose `pendingId` so only the row in flight shows progress (other rows' buttons are disabled, not spinning).
  - **Reports:** open = `isOpenReport` (`OPEN|IN_REVIEW|PENDING`, case-insensitive) on both dashboard and Reports; the Reports screen filters Open / Closed / All, searches category, details and reporter, and shows the reason text instead of the raw `targetId` (the id is on the detail page).
  - **Gating:** `AdminGate` + `useAdminAccess` (pure helpers in `adminAccess.ts`, tested by `frontend/test/adminAccess.test.mjs`). Dashboard, Users, Reports, details and Automations are on shared primitives (`Screen`, `ScreenHeader` with back, `StatusBadge`, `SegmentedControl`, `TextField`, `ListRow`); no `Alert.alert` remains in the module. Rooms/Rides/Community/Jobs/Events/Audit log screens are still legacy-styled (Phase 2).
- `AdminUserDetailScreen` shows "Member not found" (with "Back to users") for a non-UUID `userId` or a 404, and does not retry 404s (2026-10-14).
- Phase 2 visual rebuild (2026-10-14): the six moderation/list screens render through `components/AdminModerationList.tsx` (`AdminModerationList`, `ModerationBadges`, `moderationTone`) on shared primitives; same queries, search fields and destinations, still behind `AdminGate`.
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): `reportTypeLabel` (`AdminReportsScreen`, also used by the dashboard and report detail) delegates to the safety module's public `reportCategoryLabel`; `AdminUsersScreen`/`AdminUserDetailScreen` show "No display name" instead of the server's `—` placeholder.
