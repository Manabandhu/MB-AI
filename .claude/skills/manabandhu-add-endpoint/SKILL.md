---
name: manabandhu-add-endpoint
description: Add or change a ManaBandhu REST endpoint end to end — service-level authorization, controller, migration if needed, OpenAPI contract, frontend api.ts call, tests, and the authorization smoke suite. Use whenever a feature needs a new backend route or a screen needs data the backend does not serve yet.
---

# Add or change an endpoint

Work through the steps in order; each one closes a gap that previously shipped broken.

## 1. Decide who may call it

Write the rule down first: public (read-only, non-personal), any signed-in user, owner, member/participant, or admin.
Public endpoints are rare; personal data is never public.

## 2. Service

- Accept an `Actor` (from `com.manabandhu.backend.auth.Actor`) for anything user-scoped and enforce the rule here:
  `actor.requireOwner(ownerId, msg)`, `actor.requireAnyOf(msg, a, b)`, `actor.requireAdmin()`, or the module helper
  (`RideAccess`, `ExpenseAccess`, `ConversationParticipantService.requireParticipant`).
- Throw `ResponseStatusException` with 400/403/404/409 and a user-safe reason. `ApiExceptionHandler` maps everything
  else; never put exception messages in responses.
- Derive identity fields (owner, payer, sender, role) from the actor, never from the request body.
- Cap list sizes or page them. Use a row lock (`@Lock(PESSIMISTIC_WRITE)` repository method) for counters.
- Store status strings in the case the database `CHECK` constraint expects.

## 3. Controller

Thin: `Actor.require(authentication)` (or `Actor.from` for optional viewers) then one service call. Inputs are records
with Bean Validation (`@NotNull`, `@Size`, `@Pattern` for enums). If the route must be public, add the **exact** path to
`publicGetEndpoints` in `SecurityConfig` and justify it in the PR.

GraphQL: only add a resolver when the field exists in `backend/src/main/resources/graphql/schema.graphqls`; keep
`packages/api-contracts/graphql/schema.graphqls` identical (`pnpm verify:contracts`).

## 4. Database (if needed)

Follow the `manabandhu-migration` skill: new `V<n>__*.sql`, RLS on + revoke for new tables, map new columns in the
entity, verify on a fresh database.

## 5. Contract

Add the path to `packages/api-contracts/rest/openapi.yaml` with `operationId`, `summary`, request schema, and
401/403/404 responses; lint with `npx @redocly/cli@1.34.5 lint packages/api-contracts/rest/openapi.yaml` (0 errors).

## 6. Frontend

- Add a typed function in the module's `api.ts` using `apiFetch` + `parseJsonOrThrow` with the exact backend path.
  Map backend field names to UI types in `api.ts`, not in screens.
- Screens use React Query, show `LoadingState`/`ErrorState`/`EmptyState`, and never substitute sample data on error
  or empty results. Mutations show failures and only show success after a 2xx.
- `pnpm verify:routes` must pass.

## 7. Prove it

- Unit test the service: allowed path, denied path (403), not found (404), bad input (400).
- Add allow and deny checks to `scripts/local-dev/authz-smoke.mjs`, then run it against
  `scripts/local-dev/start.sh --build` (see `manabandhu-local-stack`). Must report `FAIL=0`.
- `pnpm verify`, backend tests on Java 25, then update the module's `.codex/skills/*/SKILL.md`
  (`pnpm review:commit`).
