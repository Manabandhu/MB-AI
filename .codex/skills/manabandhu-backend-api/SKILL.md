---
name: manabandhu-backend-api
description: Maintain ManaBandhu's Java 25 Spring Boot modular backend, including REST, GraphQL, security, persistence, migrations, health endpoints, and extraction-ready module boundaries. Use for any change under apps/backend or backend-facing service logic.
---

# Backend API

1. Read the affected contract in `packages/api-contracts` before code.
2. Keep controllers thin; put authorization and business behavior in services/domain modules.
3. Validate Supabase JWTs and derive user identity from the verified subject. Never trust client-supplied owner IDs.
4. Use Flyway for schema evolution, bounded queries, explicit indexes, UTC timestamps, validation, and transactions.
5. Keep REST under `/api/v1`; keep GraphQL schema compatible with the canonical contract.
6. Add tests for authorization, validation, failure behavior, and persistence boundaries.
7. Run Maven tests on Java 25.
8. Update this skill when backend structure, dependencies, security, contracts, or commands change.

