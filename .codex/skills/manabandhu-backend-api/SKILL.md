---
name: manabandhu-backend-api
description: Maintain ManaBandhu's root Java 25 Spring Boot modular backend, including REST, GraphQL, security, persistence, migrations, health endpoints, automation control plane, and extraction-ready module boundaries. Use for any change under backend or backend-facing service logic.
---

# Backend API

1. Read the affected contract in `packages/api-contracts` before code.
2. Keep controllers thin; put authorization and business behavior in services/domain modules.
3. Validate Supabase JWTs and derive user identity from the verified subject. Never trust client-supplied owner IDs. Map an explicitly typed `List<String>` from `app_metadata.roles` to normalized `ROLE_*` authorities.
4. Use Flyway for schema evolution, bounded queries, explicit indexes, UTC timestamps, validation, and transactions.
5. Keep REST under `/api/v1`; keep GraphQL schema compatible with the canonical contract.
6. Privileged automation lives in the `admin` package: require the trusted `SUPER_ADMIN` role unless the temporary public admin override is enabled, map stable operation IDs to an allow-list, require reasons/confirmations, and keep provider credentials server-side.
7. Public foundation, notifications, rooms, and rides demo content endpoints must remain read-only, contain no user data, stay under `/api/v1/foundation`, `/api/v1/notifications`, `/api/v1/rooms`, and `/api/v1/rides`, and include route fields only for client-owned in-app navigation targets.
8. Add tests for authorization, validation, failure behavior, and persistence boundaries.
9. Baseline existing Supabase schemas at Flyway version `0` so repository migrations still run from `V1`.
10. Use `pnpm dev:backend` for local backend startup; it loads `backend/.env` when present while preserving shell environment overrides, then runs the Maven wrapper.
11. Run Maven tests on Java 25.
12. Update this skill when backend structure, dependencies, security, contracts, or commands change.
