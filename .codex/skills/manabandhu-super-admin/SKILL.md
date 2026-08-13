---
name: manabandhu-super-admin
description: Maintain ManaBandhu's privileged operations control plane across the universal admin screen, Spring automation API, GitHub workflow dispatch, authorization, confirmation, and audit boundaries. Use for any Super Admin action or operational automation change.
---

# Super Admin control plane

1. Read `docs/architecture/decisions/0002-super-admin-control-plane.md`, the REST contract, and affected deployment workflow.
2. Keep `frontend/src/app/admin.tsx` as a thin route and implementation under `frontend/src/modules/super-admin`; it is an adaptive operator UI, never a credential or arbitrary-command executor.
3. Keep the backend allow-list under `backend/src/main/java/com/manabandhu/backend/admin`. Do not accept workflow names, URLs, shell commands, or secrets from the client.
4. Authorize every endpoint with `ROLE_SUPER_ADMIN` sourced only from signed JWT `app_metadata.roles`. Never trust editable user metadata.
5. Require a meaningful reason for every execution and explicit confirmation for medium/high-impact operations. Production uses protected GitHub Environments with reviewer approval.
6. Propagate actor ID and execution ID into workflows and structured logs. Do not log tokens or authorization headers.
7. Keep the OpenAPI operation, frontend types, backend records, workflow inputs, tests, and this skill synchronized.
8. Run `pnpm verify`, `pnpm test`, and the web export before handoff.
