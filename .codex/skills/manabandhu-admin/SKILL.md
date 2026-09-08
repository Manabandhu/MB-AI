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

- `frontend/src/modules/admin/adminFallbacks.ts` - demo fixtures for all admin screens

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
