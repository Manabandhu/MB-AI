---
name: manabandhu-architecture
description: Maintain ManaBandhu's system architecture, module boundaries, cross-cutting requirements, and architectural decision records. Use when adding services, moving ownership, changing data flow, selecting infrastructure, or altering current/future platform targets.
---

# Architecture

1. Read `docs/architecture/platform.md` and relevant ADRs.
2. Prefer a modular monolith until independent scaling, isolation, compliance, or release cadence justifies extraction.
3. Define ownership, data, API/event contracts, authorization boundary, failure modes, observability, and deployment impact.
4. Record durable decisions as numbered ADRs under `docs/architecture/decisions`.
5. Preserve reusable contracts/domain packages for possible watch and TV targets without placeholder runtimes.
6. Keep the active Expo workspace directly at `frontend/` and Spring Boot at `backend/`. Put each business capability in `frontend/src/modules/<module>`; do not recreate `apps/`, `frontend/universal`, or `frontend/future` hierarchies.
7. Route privileged automation through the backend allow-list and CI environment gates; clients never hold infrastructure credentials.
8. Update affected module skills and this skill in the same change.
9. Keep repository Git hooks compatible with VS Code's restricted PATH. Generated commit messages use Conventional Commits and no more than 20 words.
10. Run `pnpm verify:skills`.
