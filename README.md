# ManaBandhu

ManaBandhu is an adaptive community platform built as a governed monorepo. Its current Expo client targets native phones, tablets, foldables, mobile/tablet browsers, and desktop web. Watch and TV shells are explicit future boundaries, not active runtimes.

## Stack

- Mobile: Expo SDK 57, React Native 0.86, React 19.2, Expo Router, TypeScript 6
- Client data: TanStack Query, GraphQL Request, Zod, Zustand, React Hook Form
- Authentication: Supabase Auth with sessions stored in Expo Secure Store
- Backend: Java 25, Spring Boot 4.1, Spring Security, Spring Data JPA
- APIs: versioned REST under `/api/v1` and GraphQL at `/graphql`
- Database: Supabase Postgres 17 with Flyway migrations
- Quality: pnpm workspaces, Biome, TypeScript strict mode, Maven tests
- Operations: role-gated Super Admin control plane and protected GitHub Actions workflows

## Platform modules

- `services/ai-orchestrator`: AI assistant/chatbot, model routing, tools, safety, evaluations, and cost boundaries
- `services/chat-realtime`: human, group, support, and bot conversations
- `services/notification-worker`: in-app, push, web push, email, and SMS delivery boundary
- `services/analytics-pipeline`: privacy-aware event validation and delivery
- `packages/api-contracts`: canonical OpenAPI, GraphQL, and AsyncAPI contracts
- `packages/design-system`: cross-platform tokens and adaptive breakpoints
- `infra/deployments`: separate native, web, and backend delivery boundaries
- `infra/observability`: logs, metrics, traces, SLOs, alerts, and runbook boundary
- `frontend`: the Expo workspace, with business capabilities separated under `frontend/src/modules`

Architecture is documented in `docs/architecture/platform.md` and its ADRs.

## AI maintenance skills

Every governed module has a repo-local skill under `.codex/skills`. Root `AGENTS.md` tells AI agents which skill to load. Any behavioral, dependency, contract, path, or invariant change must update the matching `SKILL.md` in the same commit.

`pnpm verify:skills` enforces that coupling locally and in CI. `pnpm review:commit` checks staged files, while `pnpm review:history` identifies the exact commit that introduced skill drift. `pnpm verify:contracts` ensures the canonical and runtime GraphQL schemas remain identical.

## Requirements

- Node.js 22.13 or newer
- pnpm 11.21
- Java 25
- Maven is optional because the Maven wrapper is included

The current machine may use older global tooling; `.nvmrc` and `.tool-versions` define the repository versions.

## Start the mobile app

The local mobile environment is already connected to the `manabandhu` Supabase project through its publishable key.

```bash
corepack enable
pnpm install
pnpm dev:frontend
```

For Android emulators, replace `localhost` in `frontend/.env.local` with `10.0.2.2`. For a physical device, use the development machine's LAN address.

## Start the backend

Copy `backend/.env.example` to a local secret file or export the values in your shell. The database password must never be committed.

```bash
export DATABASE_PASSWORD='your-supabase-database-password'
export DATABASE_URL='jdbc:postgresql://db.qctfthanswbkqagytnst.supabase.co:5432/postgres?sslmode=require'
export DATABASE_USERNAME='postgres'
export SUPABASE_JWKS_URI='https://qctfthanswbkqagytnst.supabase.co/auth/v1/.well-known/jwks.json'
pnpm dev:backend
```

For production or serverless deployments, prefer Supabase's transaction pooler connection string instead of the direct database host and keep the Hikari pool small.

## API examples

The public readiness endpoint is `GET /api/v1/health`. All other application endpoints require a Supabase access token.

```bash
curl http://localhost:8080/api/v1/health

curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8080/api/v1/posts
```

GraphQL supports `communityPosts` and `createCommunityPost`. Set `GRAPHIQL_ENABLED=true` locally to use `/graphiql`.

## Super Admin automation

The universal `/admin` route dispatches only backend allow-listed operations. Set `AUTOMATION_GITHUB_REPOSITORY=owner/repository` and a narrowly scoped `AUTOMATION_GITHUB_TOKEN` on the backend. Assign `SUPER_ADMIN` through trusted Supabase `app_metadata.roles`; never use user-editable metadata. Configure provider secrets and required reviewers in GitHub Environments before enabling production workflows.

Install the versioned commit hook once with `pnpm hooks:install`. It rejects commits when governed module code is staged without its matching `SKILL.md` and validates API contracts.

VS Code uses the repository commit editor so an empty commit message is generated from staged areas. Generated and manually entered messages must use Conventional Commits and contain at most 20 words. Examples: `feat(frontend): add community profile module` or `fix(auth): preserve refreshed sessions`.

## Database changes

Flyway migration `V1__create_community_posts.sql` is checked in but has not been applied to the remote database. The backend applies it when started with valid database credentials. It enables RLS and revokes direct Data API access from `anon` and `authenticated`; access is mediated by the authenticated Spring API.

## Verification

```bash
pnpm lint
pnpm test
pnpm verify
pnpm review:history
```

Pull requests run independently named CI pipelines for Frontend, Backend, API Contracts, Governance, Dependency Review, Security Analysis, and Workflow Validation. Path filters avoid unrelated builds; security analysis also runs weekly.

The Stitch source screens and catalog remain under `stitch/` for implementation reference.
