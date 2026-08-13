---
name: manabandhu-foundation
description: Maintain ManaBandhu foundation journeys including splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, settings, and the canonical screen catalog. Use for core navigation or cross-module screen inventory changes.
---

# Foundation

1. Read `frontend/src/modules/foundation/MODULE.md`, `frontend/src/modules/screen-catalog.ts`, and relevant Stitch screens.
2. Keep shell routes thin, adaptive, accessible, deep-linkable, and authorization-aware across native and web.
3. Delegate authentication, notifications, and business data to their owning modules; foundation may aggregate but not duplicate ownership.
4. Keep screen IDs and routes unique and module-qualified. Catalog entries describe scope, not implementation status.
5. The root route `/` starts the public splash/welcome journey; the backend-status home screen is `/home`.
6. Run frontend checks, Expo web export, and skill verification after changes.
