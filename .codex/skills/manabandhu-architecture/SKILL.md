---
name: manabandhu-architecture
description: Maintain ManaBandhu's system architecture, module boundaries, cross-cutting requirements, and architectural decision records. Use when adding services, moving ownership, changing data flow, selecting infrastructure, or altering current/future platform targets.
---

# Architecture

1. Read `docs/architecture/platform.md` and relevant ADRs.
2. Prefer a modular monolith until independent scaling, isolation, compliance, or release cadence justifies extraction.
3. Define ownership, data, API/event contracts, authorization boundary, failure modes, observability, and deployment impact.
4. Record durable decisions as numbered ADRs under `docs/architecture/decisions`.
5. Preserve reusable contracts/domain packages for future watch and TV shells without building those runtimes now.
6. Update affected module skills and this skill in the same change.
7. Run `pnpm verify:skills`.

