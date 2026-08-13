# Foundation

Owns splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, and settings. Authentication and notifications remain dedicated modules surfaced inside foundation journeys.

Keep foundation routes and welcome step IDs in `foundationConstants.ts`, local welcome imagery in `welcomeAssets.ts`, catalog-backed foundation screen content in `catalogApi.ts`, `screenDataTypes.ts`, `foundationScreenFallbacks.ts`, and `screens/CatalogContentScreen.tsx`, and shared controls in `frontend/src/modules/shared/ui`.

The current first-batch native screens live in `screens/StitchPrototypeScreens.tsx`; the old local `stitch/` export folder has been removed and can be replaced by a fresh MCP export when provided. Do not render screenshot images as the UI.
