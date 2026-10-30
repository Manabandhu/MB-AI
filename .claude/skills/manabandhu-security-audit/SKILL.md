---
name: manabandhu-security-audit
description: Audit ManaBandhu for authorization holes, data leaks, unsafe public routes, missing RLS, leaked secrets, and fake-success frontend code, using the repo's scripts plus the REVIEW.md rubric. Use for security reviews, pre-release checks, reviewing a PR that touches auth/data/migrations, or when asked to "review the project".
---

# Security audit

Run the automated checks first, then read code in the order below. Report findings with file:line, a concrete
attack or failure scenario, and severity; verify each one before reporting (run it against the local stack when you
can).

## Automated checks

```bash
pnpm verify:secrets                 # credentials in tracked files (values never printed)
pnpm verify:routes                  # frontend calls with no backend route
pnpm verify                         # lint, types, contracts, skills, routes, secrets
scripts/local-dev/start.sh --reset --build && node scripts/local-dev/authz-smoke.mjs
```

Never print secret values while investigating; report file and line only and require rotation for anything that was
ever committed (history keeps it).

## Manual review order

1. **Public surface** — `backend/.../config/SecurityConfig.java`: every `publicGetEndpoints` entry must be an exact,
   read-only, non-personal route. Then check each public handler's response record for user IDs, contact info,
   addresses, notes, or counts derived from private data.
2. **Unchecked handlers** — list mappings that take an ID but never resolve an actor:
   ```bash
   grep -rn "@PathVariable\|@Argument" backend/src/main/java --include=*Controller.java | grep -v Authentication
   ```
   For each, confirm the service enforces ownership/membership (`Actor`, `RideAccess`, `ExpenseAccess`,
   `requireParticipant`). GraphQL resolvers count too.
3. **Client-controlled privilege** — request records containing `ownerId`, `userId`, `role`, `verified`, `status`,
   `isAdmin`, or amounts that the server should derive. Grep `input.verified()`, `@RequestParam String role`.
4. **State and money** — bookings, seats, balances, settlements: validated transitions, row locks, terminal states.
5. **Database** — new migrations follow `manabandhu-migration`; run the RLS query from that skill; when the Supabase
   project is active run the MCP `get_advisors` security check.
6. **Frontend** — direct `supabase.from(` calls outside onboarding, `catch {}` that hides failures, sample/demo data
   shown as real (`SAMPLE_`, `DEFAULT_`, `MOCK_` constants, hard-coded counts), test backdoors, secrets in
   `app.json`/`EXPO_PUBLIC_*` (only publishable or referrer-restricted keys belong there).
7. **CI/CD** — workflows declare least-privilege `permissions:`, never interpolate `${{ inputs.* }}`/`github.event.*`
   into `run:` scripts, and production operations require reviewed refs and environment approval.
8. **Tooling configs** — `.mcp.json`, `.vscode/`, `frontend/eas.json`, scripts: tokens must come from environment variables.

## Output

Use the categories from `REVIEW.md`. For each confirmed finding: what is exposed or broken, who can trigger it, how to
reproduce (curl with a minted token is ideal), and the fix. Record significant audits in `docs/reviews/YYYY-MM-DD-*.md`.
