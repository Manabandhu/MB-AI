---
name: manabandhu-local-stack
description: Run ManaBandhu end to end against the hosted Supabase database (the default), or optionally on an offline PostgreSQL stack for the authorization smoke test — then exercise it with real users and screenshots. Use when asked to run, start, demo, smoke-test, or screenshot the app, or to prove a backend or UI change works for real.
---

# Run ManaBandhu locally

**Default: hosted Supabase.** Local and sandbox runs connect straight to the Supabase database with Flyway off; no
local PostgreSQL is installed. See "Against the hosted Supabase project" below (`pnpm dev:backend` or
`scripts/local-dev/start-supabase.sh`). Never migrate the hosted database from a laptop or sandbox: the deployed
backend applies pending migrations on startup and the `migrate` workflow is the manual path. If a branch adds a
migration the hosted database lacks, Hibernate validation fails at startup; ask the user before applying it (the
Supabase MCP can apply it, but record the matching `flyway_schema_history` row with Flyway's exact checksum, verified
against a Flyway-applied copy, or production startup fails validation).

**Optional: offline stack** for the authorization smoke test, which needs locally minted logins that Supabase rejects.
It needs PostgreSQL 16 + PostGIS, which cloud sessions no longer install automatically
(`sudo apt-get install -y postgresql-16 postgresql-16-postgis-3`). The backend trusts a local signing key, and the
database gets small stand-ins for Supabase's `auth` schema.

## 1. Offline backend + database

```bash
sudo service postgresql start          # PostgreSQL 16 with PostGIS (install it first; see above)
scripts/local-dev/start.sh --reset     # add --build after backend code changes
```

`start.sh` creates the `manabandhu` database, applies `scripts/local-dev/supabase-stub.sql`, seeds four users, starts
the JWKS server on :9999, and starts the backend on :8080 (all Flyway migrations apply, Hibernate validates the schema).
Logs: `.local-dev/backend.log`. Stop with `scripts/local-dev/stop.sh`.

| User | UUID | Typical role in checks |
| --- | --- | --- |
| A | `11111111-1111-1111-1111-111111111111` | driver, group owner, organizer |
| B | `22222222-2222-2222-2222-222222222222` | rider, group member |
| C | `33333333-3333-3333-3333-333333333333` | stranger (must be denied) |
| D | `44444444-4444-4444-4444-444444444444` | admin (mint with `ADMIN`) |

```bash
TOKEN=$(node scripts/local-dev/auth.mjs mint 11111111-1111-1111-1111-111111111111)
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/me
node scripts/local-dev/authz-smoke.mjs   # ~80 allow/deny checks; must report FAIL=0
```

## 2. Web app against the local backend

```bash
cd frontend
CI=1 BROWSER=none EXPO_PUBLIC_API_URL=http://localhost:8080 \
  EXPO_PUBLIC_SUPABASE_URL=http://localhost:9999 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-dev-key \
  npx expo start --web --port 8081
```

`CI=1` disables file watching: restart Metro after editing frontend code. The first page load compiles the bundle and
can take a minute.

To be signed in without Supabase, inject a session for a minted token before the page loads. The storage key is
`sb-localhost-auth-token` because the Supabase URL host is `localhost`:

```js
// Playwright: await context.addInitScript(fn, session) before page.goto(...)
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
const session = { access_token: token, refresh_token: 'local-only', token_type: 'bearer', expires_in: 7200,
  expires_at: payload.exp, user: { id: payload.sub, aud: 'authenticated', role: 'authenticated', email: payload.email,
  app_metadata: payload.app_metadata, user_metadata: payload.user_metadata } };
(s) => localStorage.setItem('sb-localhost-auth-token', JSON.stringify(s))
```

Chromium for Playwright is at `/opt/pw-browsers/chromium-*/chrome-linux/chrome` in cloud sessions; use
`playwright-core` with `executablePath` (do not run `playwright install`). Use a 390×844 viewport for phone layouts and
wait for `networkidle` plus a few seconds before screenshots.

## Real sign-up and sign-in locally

`auth.mjs serve` (started by `start.sh`) also stands in for the Supabase Auth endpoints the app uses: password sign-up
and sign-in, phone OTP, password recovery, OAuth (`/auth/v1/authorize` redirects straight back with a session), refresh,
user, and logout. New accounts are stored in `.local-dev/auth-users.json` (passwords scrypt-hashed) and mirrored into
`auth.users`; `start.sh --reset` forgets them. Phone codes are random and written to `.local-dev/jwks.log`
(`grep "OTP for" .local-dev/jwks.log`). With the web app pointed at `EXPO_PUBLIC_SUPABASE_URL=http://localhost:9999`
you can drive the real flow (welcome → sign up → onboarding → home) with Playwright instead of injecting tokens.

## Against the hosted Supabase project

`scripts/local-dev/start-supabase.sh [--build]` runs the backend (:8080) and web app (:8081) against the real Supabase
database and Auth with Flyway off (`--migrate` opts in; ask the user first). `pnpm dev:backend` does the same for the
backend alone, reading `DATABASE_PASSWORD` from `backend/.env`. It needs network access to `*.supabase.co` and `*.pooler.supabase.com`, the
`DATABASE_PASSWORD` environment secret, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (fetch it with the Supabase MCP
`get_publishable_keys`; never commit it). Sign in with real accounts; never mint local tokens against Supabase. Cloud sandboxes need outbound TCP to the pooler
(port 5432); if DNS or the connection fails, the environment's network policy blocks it. If the
pooler host differs, set `SUPABASE_POOLER_HOST` (for example `aws-1-us-east-2.pooler.supabase.com`).

## Sharing a live link

Cloud sessions cannot expose ports publicly unless the environment's network policy allows a tunnel host
(`ngrok.com`/`ngrok-agent.com`, or `exp.host`/`expo.dev` for `expo start --tunnel`). If those are blocked, say so and
share screenshots instead; never claim a localhost URL is reachable by the user.

## Gotchas

- `JAVA_HOME` may point at Java 21; `start.sh` switches to Java 25 automatically, `./mvnw` does not.
- Never kill processes with `pkill -f <pattern>` from a shell whose own command line contains the pattern; use the pid
  files in `.local-dev/` or `fuser <port>/tcp`.
- Push, uploads, user suspension, and the maps proxy return 503 locally because no provider keys are configured.
- Never apply `supabase-stub.sql` to a real Supabase project.
