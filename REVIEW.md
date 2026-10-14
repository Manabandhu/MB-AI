# ManaBandhu review rules

Use these when reviewing any change in this repository. Every rule below exists because the matching defect shipped
here before (see `docs/reviews/`). Flag violations as **blocking** unless marked otherwise.

## Security and privacy (blocking)

1. **Ownership in services.** Any endpoint that reads or changes user-owned data must check the caller in the service
   layer (`Actor`, `RideAccess`, `ExpenseAccess`, `requireParticipant`). A check that exists only in a REST controller
   is a finding: GraphQL resolvers and other callers bypass it.
2. **Never trust client-supplied identity or roles.** Owner, payer, rater, role, `verified`, and similar fields come
   from the JWT subject or server logic, never from the request body or query string.
3. **Public routes.** A new `permitAll`/public GET must be an exact path to read-only, non-personal data. Reject `/**`
   wildcards over modules with user data and any public route that returns user IDs, contact info, addresses, or notes.
4. **New tables** enable RLS and revoke `anon`/`authenticated`, or ship an explicit, reviewed policy. `SECURITY
   DEFINER` functions must `SET search_path`.
5. **Secrets.** No real credentials in tracked files, including `.env.example`, tool configs (`.kilo/`, `.mcp.json`),
   scripts, and `app.json`. `pnpm verify:secrets` must pass. If a secret was ever committed, require rotation.
6. **Error responses** never include exception messages, SQL, or class names for 5xx (`ApiExceptionHandler`).
7. **Admin and automation.** Production deploy/migrate/rollback require `SUPER_ADMIN` and a `main`/`v*` ref; every
   privileged action is written to `admin_audit_log`.
8. **Exact locations.** A room's exact address and similar precise data are visible only to the owner/admin.

## Correctness (blocking)

9. **No fake success.** Reject code that swallows an API error and then shows success, returns sample objects or
   invented IDs, or falls back to hard-coded content when the real list is empty. Errors must reach the user.
10. **No invented personal numbers.** Counts, balances, notifications, and badges shown as the user's data must come
    from the backend. Placeholder marketing copy must not look like personal data.
11. **Frontend ↔ backend contract.** Every `apiFetch` path exists (`pnpm verify:routes`), request/response field names
    match the Java records, and REST changes update `packages/api-contracts/rest/openapi.yaml`.
12. **Status values** must satisfy the database `CHECK` constraints (ride tables store lowercase). UI comparisons are
    case-insensitive.
13. **State machines.** Seat counts, balances, and similar counters change only through validated transitions under a
    row lock; terminal states (e.g. a cancelled booking) cannot be reopened.
14. **Migrations** are append-only (never edit an applied `V*.sql`), run on a fresh database
    (`scripts/local-dev/start.sh --reset`), and keep Hibernate `ddl-auto: validate` passing.
15. **Unbounded reads.** Lists must be paged or capped; no N+1 loops that load whole tables to find one row.

## Tests and governance (blocking unless noted)

16. Authorization or data-rule changes add a unit test for the denied path and, when behavior is cross-module, a check
    in `scripts/local-dev/authz-smoke.mjs`.
17. Module skills in `.codex/skills/` are updated in the same commit (`pnpm review:commit`).
18. `pnpm verify` passes; backend tests pass on Java 25.

## Style (non-blocking, report as nits)

- Match surrounding code: comment density, naming, and the module's existing patterns.
- Use typed `Href` for router targets instead of `as any`; keep Biome clean.
- Prefer small, named service methods (`requireVisible`, `listFor`) over inline permission logic in controllers.
