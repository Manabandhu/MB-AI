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
6. Run `pnpm verify:contracts`, then validate every affected producer and consumer.
7. Update this skill when contract locations, generators, compatibility policy, or validation commands change.

