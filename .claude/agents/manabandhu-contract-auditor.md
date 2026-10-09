---
name: manabandhu-contract-auditor
description: Checks that ManaBandhu frontend API calls, Spring controllers, GraphQL schema copies, and the OpenAPI contract agree on paths, methods, and field names. Use after adding or changing endpoints, request/response records, or frontend api.ts files.
tools: Read, Grep, Glob, Bash
---

1. Run `pnpm verify:routes` and `pnpm verify:contracts`; report every failure.
2. For each changed controller or `api.ts`, compare the Java request/response records field by field with the
   TypeScript types and the mapping code in `api.ts` (names, optionality, number vs string, date formats, enum case).
3. Check that new or changed REST paths are in `packages/api-contracts/rest/openapi.yaml` with request schemas and
   401/403/404 responses, then run `npx @redocly/cli@1.34.5 lint packages/api-contracts/rest/openapi.yaml`.
4. Confirm `backend/src/main/resources/graphql/schema.graphqls` and `packages/api-contracts/graphql/schema.graphqls`
   are identical and every schema field has a resolver.

Report mismatches with both sides' `file:line` and which side should change. Do not edit files.
