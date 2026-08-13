# ManaBandhu

ManaBandhu is a mobile-first community platform built as a small monorepo. The repository contains an Expo application, a Spring Boot API, and the original Stitch design export.

## Stack

- Mobile: Expo SDK 57, React Native 0.86, React 19.2, Expo Router, TypeScript 6
- Client data: TanStack Query, GraphQL Request, Zod, Zustand, React Hook Form
- Authentication: Supabase Auth with sessions stored in Expo Secure Store
- Backend: Java 25, Spring Boot 4.1, Spring Security, Spring Data JPA
- APIs: versioned REST under `/api/v1` and GraphQL at `/graphql`
- Database: Supabase Postgres 17 with Flyway migrations
- Quality: pnpm workspaces, Biome, TypeScript strict mode, Maven tests

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
pnpm dev:mobile
```

For Android emulators, replace `localhost` in `apps/mobile/.env.local` with `10.0.2.2`. For a physical device, use the development machine's LAN address.

## Start the backend

Copy `apps/backend/.env.example` to a local secret file or export the values in your shell. The database password must never be committed.

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

## Database changes

Flyway migration `V1__create_community_posts.sql` is checked in but has not been applied to the remote database. The backend applies it when started with valid database credentials. It enables RLS and revokes direct Data API access from `anon` and `authenticated`; access is mediated by the authenticated Spring API.

## Verification

```bash
pnpm lint
pnpm test
```

The Stitch source screens and catalog remain under `stitch/` for implementation reference.
