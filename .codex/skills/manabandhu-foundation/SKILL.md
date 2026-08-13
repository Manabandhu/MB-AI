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
6. Keep foundation routes and welcome step IDs in `frontend/src/modules/foundation/foundationConstants.ts`; keep local imagery in `welcomeAssets.ts`, shared controls in `frontend/src/modules/shared/ui`, and catalog-backed foundation screens in `catalogApi.ts`, `screenDataTypes.ts`, `foundationScreenFallbacks.ts`, and `screens/CatalogContentScreen.tsx`.
7. Stitch screens 1-27 are implemented as native Expo screens in `frontend/src/modules/foundation/screens/StitchPrototypeScreens.tsx`, translated from local Stitch HTML rather than screenshot rendering. The old local `stitch/` export folder may be deleted before a fresh MCP export arrives. The Stitch splash route auto-advances to `/welcome` while staying tappable, temporary demo sign-in routes to `/home`, and repeated buttons/icons/inputs should use Gluestack or `frontend/src/modules/shared/ui`.
8. Foundation home and catalog screens must connect forward into onboarding, explore, search, saved, notifications, profile, settings, rooms, rides, chat, community, and auth routes without requiring manual URL entry. Explore uses a super-app grouped service grid for many current/future modules; route unavailable future-module tiles to `/search` until their module routes exist.
9. Run frontend checks, Expo web export, and skill verification after changes.
