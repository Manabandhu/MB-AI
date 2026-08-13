---
name: manabandhu-api-contracts
description: Maintain ManaBandhu's canonical OpenAPI, GraphQL, and AsyncAPI contracts and their consumers. Use when adding or changing endpoints, fields, operations, events, generated clients, compatibility rules, pagination, errors, or API versions.
---

# API contracts

1. Change the canonical artifact in `packages/api-contracts` before implementation.
2. Treat schemas as public compatibility boundaries across mobile, web, future watch/TV, backend, workers, and partners.
3. Prefer additive changes. Version breaking REST paths, GraphQL behavior, and event names explicitly.
4. Specify authentication, authorization expectations, validation, nullability, limits, errors, pagination, and idempotency.
5. Keep `packages/api-contracts/graphql/schema.graphqls` byte-identical to the backend runtime schema.
6. The Super Admin REST surface is `/api/v1/admin/automations`; changes require synchronized frontend types and backend records plus explicit 401, 403, confirmation, provider failure, and temporary public-admin override documentation.
7. Public foundation content is exposed through additive REST endpoints under `/api/v1/foundation` and must not require authentication or expose user data.
8. Run `pnpm verify:contracts`, then validate every affected producer and consumer.
9. Update this skill when contract locations, generators, compatibility policy, or validation commands change.
