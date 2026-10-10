---
name: manabandhu-api-contracts
description: Maintain ManaBandhu's canonical OpenAPI, GraphQL, and AsyncAPI contracts and their consumers. Use when adding or changing endpoints, fields, operations, events, generated clients, compatibility rules, pagination, errors, or API versions.
---

# API contracts

1. Change the canonical artifact in `packages/api-contracts` before implementation.
2. Treat schemas as public compatibility boundaries across mobile, web, future watch/TV, backend, workers, and partners.
3. Prefer additive changes. Version breaking REST paths, GraphQL behavior, and event names explicitly.
4. Specify authentication, authorization expectations, validation, nullability, limits, errors, pagination, and idempotency.
5. Keep `packages/api-contracts/graphql/schema.graphqls` byte-identical to the backend runtime schema.
6. The Super Admin REST surface is `/api/v1/admin/automations`; changes require synchronized frontend types and backend records plus explicit 401, 403, confirmation, provider failure, and temporary public-admin override documentation.
7. Public demo content is exposed through additive REST endpoints under `/api/v1/foundation`, `/api/v1/notifications`, `/api/v1/rooms`, and `/api/v1/rides`; it must not require authentication or expose user data.
 8. Run `pnpm verify:contracts`, then validate every affected producer and consumer.
  9. Covered modules: community, rooms, rides, jobs, events, expenses, marketplace, referrals, immigration, safety, utilities, notifications, chat, ai, foundation, admin, auth.

- Day 01: added `GET /me` identity endpoint to the REST OpenAPI contract with `Identity` schema (`id`, `email`, `fullName`, `role`); documented that role is derived from trusted `app_metadata.roles` and the endpoint requires a verified JWT; added references to the backend `IdentityController`.
  10. Update this skill when contract locations, generators, compatibility policy, or validation commands change.
- Ride contract enums are aligned: offers use `draft`, `active`, `in_progress`, `completed`, `cancelled` (stored lowercase; clients compare case-insensitively); requests use `pending`, `accepted`, `rejected`, `withdrawn`; participants use `DRIVER`/`RIDER`; bookings use `pending`/`confirmed`/`cancelled`; ratings enforce 1-5 with optional comment.

- Day 01: added `GET /me` identity endpoint to the REST OpenAPI contract with `Identity` schema (`id`, `email`, `fullName`, `role`); documented that role is derived from trusted `app_metadata.roles` and the endpoint requires a verified JWT; added references to the backend `IdentityController`.
- Security & correctness hardening (2026-10): `rest/openapi.yaml` was invalid YAML (mis-indented `Health` schema) and now validates with `npx @redocly/cli@1.34.5 lint` (0 errors; style warnings remain). Uses OpenAPI 3.1 null types (`type: [string, 'null']`), every operation has a `summary`, and new endpoints are documented (expenses groups/members/expenses/balances/settlements, community join/leave, ride bookmarks/booking status/maps proxy, referrals public/offer, notification settings, immigration resource detail, admin directory/audit log). Ride offer statuses are stored lowercase (`draft|active|in_progress|completed|cancelled`).
- Notifications inbox (2026-10 review): `GET /notifications/inbox` is authenticated and returns `NotificationInbox` (`items` of `NotificationInboxItem`: `id`, `title`, `body`, `meta`, `read`, `route`, `createdAt`) instead of public demo `CatalogScreenContent`. `pnpm verify:routes` checks frontend `apiFetch` paths against backend mappings.
- `NotificationInboxItem` requires `id`, `title`, `body`, `meta` (notification type), `read`, `createdAt`; only `route` is nullable. `scripts/verify-api-routes.mjs` also reads `@RequestMapping(value|path = ...)` base paths and reports how many `apiFetch` calls build their path dynamically (not statically checkable).
- P0 hardening (2026-10-10): `GET /immigration/checklists` is authenticated and returns only the caller's checklists (documents `401`).
- P0 hardening (2026-10-10): documented `GET /referrals/{referralId}/request` and `/offer` (visibility rule, 401/404); `/referrals/public` lists open referrals only. Quoted two notification descriptions that contained commas, which broke the Redocly lint (0 errors again).
