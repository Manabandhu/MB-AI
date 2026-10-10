---
name: manabandhu-super-admin
description: Maintain ManaBandhu's privileged operations control plane across the universal admin screen, Spring automation API, GitHub workflow dispatch, authorization, confirmation, and audit boundaries. Use for any Super Admin action or operational automation change.
---

# Super Admin control plane

1. Read `docs/architecture/decisions/0002-super-admin-control-plane.md`, the REST contract, and affected deployment workflow.
2. Keep `frontend/src/app/admin.tsx` as a thin route and implementation under `frontend/src/modules/admin`; it is an adaptive operator UI, never a credential or arbitrary-command executor.
3. Keep the backend allow-list under `backend/src/main/java/com/manabandhu/backend/admin`. Do not accept workflow names, URLs, shell commands, or secrets from the client.
4. Authorize every endpoint with `ROLE_SUPER_ADMIN` sourced only from signed JWT `app_metadata.roles`, except while the temporary `ADMIN_PUBLIC_ACCESS_ENABLED=true` override is enabled for local/demo access.
5. Never trust editable user metadata for privileged roles. When the temporary public override handles an unauthenticated execution, use the stable actor id `public-demo`.
6. Require a meaningful reason for every execution and explicit confirmation for medium/high-impact operations. Production uses protected GitHub Environments with reviewer approval.
7. Propagate actor ID and execution ID into workflows and structured logs. Do not log tokens or authorization headers.
8. Keep the OpenAPI operation, frontend types, backend records, workflow inputs, tests, and this skill synchronized.
9. Run `pnpm verify`, `pnpm test`, and the web export before handoff.
10. Current frontend implementation: thin route at `frontend/src/app/admin.tsx` delegates to `frontend/src/modules/admin/screens/AdminDashboardScreen.tsx`. Admin screens use `useQuery` against typed API client in `frontend/src/modules/admin/api.ts` with live backend queries and error/empty states. All moderation endpoints are read-only in the first batch.
11. Admin moderation includes rides read access through `GET /api/v1/admin/rides` with projections that exclude private fields not needed for moderation.
12. Skill remains synchronized with admin route ownership; recent admin UI typing fixes are tracked under the admin module skill.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent admin guard changes: added `useRequireAuth('/sign-in')` to all admin routes (`/admin`, `/admin/users`, `/admin/reports`, `/admin/rooms`, `/admin/rides`, `/admin/community`, `/admin/jobs`, `/admin/events`, `/admin/audit-log`). Fixed `RideOffer` entity to include `reported` field and updated `AdminRidesController` to use `offer.isReported()` instead of hardcoded `false`.
- Recent authorization & fallback hardening: aligned Spring Security and `AdminAccessPolicy` to accept both `ROLE_ADMIN` and `ROLE_SUPER_ADMIN` from verified Supabase JWTs.
- Fallback cleanup: deleted `adminFallbacks.ts` and removed fallback objects from `AdminDashboardScreen`, `AdminUsersScreen`, `AdminReportsScreen`, `AdminRoomsScreen`, `AdminRidesScreen`, `AdminCommunityScreen`, `AdminJobsScreen`, `AdminEventsScreen`, and `AdminAuditLogScreen` in favor of live backend endpoints, loading states, and error/empty states.
- Admin safety reports & moderation console: Added `AdminReportsController` under `com.manabandhu.backend.admin` (`GET /api/v1/admin/reports`, `POST /api/v1/admin/reports/{id}/resolve`), and upgraded `AdminDashboardScreen.tsx` with real-time KPI metrics, priority action queue tabs, and live moderation actions.
- Repo-Wide Code Review & Defect Remediation: Audited all admin screens for defensive state handling, verified touch targets compliance with `hitSlop`, and confirmed role-based authorization in `SuperAdminController`.
- Security & correctness hardening (2026-10): Production automations (deploy, migrate, rollback) require `SUPER_ADMIN` and a `main` or `v*` release-tag ref; all refs must match `^[A-Za-z0-9][A-Za-z0-9._/-]*$`. Automation dispatches, report resolutions and user status changes are written to `admin_audit_log` (V31) via `AdminAuditService`. Added `AdminDirectoryController`: `GET /api/v1/admin/{users,users/{id},rooms,jobs,events,community,audit-log}` (capped at 200 rows) and `PATCH /api/v1/admin/users/{id}/status` (Supabase Auth admin ban API; needs `SUPABASE_SERVICE_ROLE_KEY`). `/actuator/**` (except health/info) is admin-only.
- No invented numbers (2026-10): `AdminDashboardScreen` no longer shows hard-coded KPIs ("7 pending", "24 verified", "18m SLA") or sample queue items. KPIs are counts from `/api/v1/admin/{reports,users,rooms,rides,community,jobs,events}` (open reports = `OPEN|IN_REVIEW|PENDING`; flagged = `reported` listings); the priority queue lists up to 5 open reports with a real `resolveReport` action; failures show `ErrorState`.
- Cleanup: `/admin/automations` is now a real route (`AdminAutomationsScreen`) listing automations and their executions; dead `SuperAdminScreen.tsx` deleted.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
