# End-to-end security and correctness review — 2026-10-09

## Scope

Whole repository: Spring backend (every controller, service, GraphQL resolver, `SecurityConfig`, Flyway V1–V31),
Expo frontend (every module `api.ts` and its screens), API contracts, GitHub workflows, tool configs, and scripts.
Hosted Supabase projects were checked through the Supabase MCP; all were paused, so live advisors returned nothing.

## Findings fixed

Commit `663a178` (first pass, 208 files):

- **Authorization.** Many REST and GraphQL handlers took an ID and acted without checking the caller. Ownership and
  membership checks moved into services through `Actor`, `RideAccess`, `ExpenseAccess`, and
  `ConversationParticipantService.requireParticipant`, so GraphQL cannot bypass them.
- **Client-controlled privilege.** Owner, payer, rater, role, and `verified` values were read from request bodies;
  they now come from the JWT or server logic.
- **Public surface.** Wildcard public GETs exposed user data (rides, rooms with exact addresses, notifications
  settings, onboarding). The public list is now exact, read-only, non-personal routes.
- **Data rules.** Ride status casing violated `CHECK` constraints; seat counts could go negative or be reopened after
  cancellation; expense balances read unflushed data; referrals inserted placeholder user IDs into `auth.users` FKs;
  the notification dispatcher marked rows sent with no provider and had no HTTP timeouts.
- **Database.** V31 enables RLS and revokes `anon`/`authenticated` on V28 tables, adds participant-only realtime
  policies on `messages`, and pins `search_path` on the purge function.
- **Frontend.** Removed a test login backdoor, direct Supabase table writes for expenses/community, the realtime
  hook listening to an unused table, SecureStore session truncation (chunked storage), and all lint warnings.

This commit (second pass):

- **Leaked credentials** in `.kilo/kilo.json` (Supabase access token, GitHub PAT) and `.kilo/agent-manager.json`.
  Replaced with environment references and untracked. **They remain in git history (`1e8022a`) and must be rotated.**
- **Google Maps Android key** moved from `app.json` to build-time `GOOGLE_MAPS_ANDROID_API_KEY` (`app.config.js`).
- **Hard-coded integration secret** removed from `scripts/integration-auth.mjs`.
- **Fake notifications.** `GET /api/v1/notifications/inbox` was public and returned demo content for everyone; it now
  requires a JWT and returns the caller's notifications. `DEFAULT_NOTIFICATIONS` was removed from the inbox screen.
- **Fake chats.** `ChatListScreen` prepended sample inquiries with fake online/verified indicators; removed.
- **Silent reaction failures.** Post reactions now throw on non-2xx and the optimistic like is rolled back.
- **CI/CD.** Six workflows lacked `permissions:`; all now default to `contents: read`. The `migrate` workflow now
  baselines at version 0 like backend startup.

## Guardrails added

- `pnpm verify:routes` — every frontend `apiFetch` path must match a backend mapping (152 calls / 245 routes).
- `pnpm verify:secrets` — scans tracked files for credentials without printing values.
- Both run in `pnpm verify` and the Quality workflow.
- `scripts/local-dev/` — local Postgres + JWKS + backend stack with four seeded users and an 81-check
  authorization smoke suite (`authz-smoke.mjs`).
- Claude Code project setup: `CLAUDE.md`, `REVIEW.md` (rules derived from these findings), skills in
  `.claude/skills/` (local stack, add endpoint, migration, security audit), review agents in `.claude/agents/`,
  `.mcp.json` (read-only Supabase + Playwright, tokens from env), a cloud SessionStart hook, and
  `.vscode/extensions.json`.

## Verification evidence

- `pnpm verify` (Biome, TypeScript, contracts, skills, routes, secrets): pass.
- Frontend unit tests and Spring tests on Java 25: pass.
- Fresh-database run of V1–V31 with Hibernate validation: pass.
- `authz-smoke.mjs` against the local stack: 81 pass, 0 fail.
- OpenAPI lint (Redocly 1.34.5): 0 errors.

## Open items

1. **Rotate** the Supabase access token and GitHub PAT from history, the database password, and confirm the Google
   Maps keys are restricted by app signature/referrer.
2. Hosted Supabase projects are paused; run `get_advisors` (security and performance) after restoring one and
   applying V31.
3. Content services for Marketplace, Immigration, Referrals, and Rooms still return hard-coded marketing metrics
   (counts, ratings). They are not presented as personal data but should be derived or labelled.
4. The AI assistant module is a placeholder with no backend.
5. `RoomsScreen.tsx` is very large; split it before further feature work.
6. Push, uploads, user suspension, and the maps proxy need provider keys configured per environment.
