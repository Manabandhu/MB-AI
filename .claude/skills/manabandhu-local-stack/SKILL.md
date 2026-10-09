---
name: manabandhu-local-stack
description: Run ManaBandhu end to end without Supabase — PostgreSQL + PostGIS, a local JWKS/token minter, the Spring backend, and the Expo web app — then exercise it with real users and screenshots. Use when asked to run, start, demo, smoke-test, or screenshot the app, or to prove a backend or UI change works for real.
---

# Run ManaBandhu locally

Everything runs on one machine. No Supabase project, real credentials, or network access to Supabase is needed:
the backend trusts a local signing key, and the database gets small stand-ins for Supabase's `auth` schema.

## 1. Backend + database

```bash
sudo service postgresql start          # PostgreSQL 16 with PostGIS (installed by the cloud session hook)
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
