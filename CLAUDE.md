@AGENTS.md

# Claude Code guide for ManaBandhu

The module skills listed above live in `.codex/skills/<name>/SKILL.md`. Read the matching one before editing a governed
module and update it in the same commit (`pnpm review:commit` tells you which ones a staged change requires).
Claude-specific skills, agents, and review rules live in `.claude/` and `REVIEW.md`.

## Commands

| Task | Command |
| --- | --- |
| Everything CI checks (lint, types, contracts, skills, routes, secrets) | `pnpm verify` |
| Frontend tests | `pnpm --filter @manabandhu/frontend test` |
| Backend tests (Java 25) | `cd backend && ./mvnw -q -B test` |
| Start backend + local DB without Supabase | `scripts/local-dev/start.sh [--reset] [--build]` |
| Authorization smoke suite (needs the local stack) | `node scripts/local-dev/authz-smoke.mjs` |
| Mint a local bearer token | `node scripts/local-dev/auth.mjs mint <uuid> [ADMIN]` |
| Frontend calls vs backend routes | `pnpm verify:routes` |
| Credential scan of tracked files | `pnpm verify:secrets` |

In cloud sessions `.claude/hooks/session-start.sh` installs pnpm deps, Java 25, Maven deps, and PostgreSQL + PostGIS.

## Non-negotiable rules (each one fixed a real bug in this repo)

- **Authorization lives in services.** Resolve the caller with `Actor.require(authentication)` and check ownership or
  membership inside the service (`actor.requireOwner`, `RideAccess`, `ExpenseAccess`,
  `ConversationParticipantService.requireParticipant`) so REST and GraphQL cannot diverge.
- **Public routes are an explicit list** in `SecurityConfig`. Never add a `/**` wildcard over a module that also serves
  user data.
- **Every new table** enables RLS and revokes `anon`/`authenticated` in its Flyway migration unless a policy is intended.
  Never edit an applied migration; add `V<n+1>__*.sql`.
- **No fake success.** Frontend code must surface API errors; never return sample data, invented IDs, or a success
  screen when a request failed. Never show invented numbers as if they were the user's data.
- **Frontend talks to the backend**, not to Supabase tables (onboarding config/progress is the only exception and is
  covered by owner RLS). Every `apiFetch` path must match a backend route (`pnpm verify:routes`).
- **No secrets in git.** `.env.example` files hold placeholders only; tooling configs reference `{env:…}`/`${…}`.
- **Status strings** for rides are stored lowercase (`active`, `in_progress`, …); compare case-insensitively in the UI.
- Keep REST changes reflected in `packages/api-contracts/rest/openapi.yaml` (must lint with
  `npx @redocly/cli@1.34.5 lint`), and the two GraphQL schema copies identical (`pnpm verify:contracts`).

## Before you hand off

1. `pnpm verify` and the relevant tests pass.
2. For backend authorization or data changes: run the local stack and `authz-smoke.mjs`; add a check for the new rule.
3. `pnpm review:commit` is clean (module skills updated).
4. Review the diff against `REVIEW.md`.
