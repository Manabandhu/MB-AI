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
7. Route privileged automation through the backend allow-list and CI environment gates; clients never hold infrastructure credentials. Temporary public Super Admin demo access is controlled only by `ADMIN_PUBLIC_ACCESS_ENABLED`, which is refused at startup unless the JWT issuer is local.
8. Update affected module skills and this skill in the same change.
9. Keep repository Git hooks compatible with VS Code's restricted PATH. Generated commit messages use Conventional Commits and no more than 20 words.
10. Give every business module its own folder, `MODULE.md`, and coupled skill rule. The canonical screen inventory lives in `frontend/src/modules/screen-catalog.ts`.
11. Run `pnpm verify:skills`.
12. `packages/core` (`@manabandhu/core`) holds platform-free TypeScript every client can share: the HTTP client, response parsers, error types, formatters, and the `ModuleMeta`/`ClientSurface` types. It must not import React, React Native, Expo, Supabase, or Tamagui; `pnpm verify:core` (part of `pnpm lint`) enforces this, and its tests run with `pnpm test:packages`.
13. Cross-module imports go through the target module's `index.ts` (its public API). Each business module declares its launcher entry in `module.ts` (`ModuleMeta` from `@manabandhu/core`); Home widgets are exported by the owning module and arranged by `foundation/home/registry.ts`.
14. ADRs 0005 (Tamagui design system and ratchet), 0006 (module-owned Home widgets and launcher metadata), and 0007 (shared core and tokens for future watch, car, and TV clients) were added. Point 5 above now means: shared code and tokens are prepared (`packages/core`, `tokens.json`, `formFactor.ts`), but no watch/car/TV runtime dependencies or app folders until a target starts.
15. `@manabandhu/core` formatters must run on Hermes: no `Intl.RelativeTimeFormat`, `Intl.PluralRules`, or `notation: 'compact'` without a fallback (Hermes on iOS/Android lacks them and throws "undefined cannot be used as a constructor"). `formatRelative` falls back to English wording, and compact numbers/money use a local K/M/B rule. Tests simulate the missing API.
16. The local compact-number rule promotes to the next unit when rounding reaches 1000 (999,999 → "1M", not "1000K") and supports K/M/B/T. Tests cover the boundaries.
