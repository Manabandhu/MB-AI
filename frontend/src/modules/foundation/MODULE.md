# Foundation

Owns splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, and settings. Authentication and notifications remain dedicated modules surfaced inside foundation journeys.

Keep foundation route/query keys and welcome fallback content in `foundationConstants.ts`, API response shapes in `welcomeTypes.ts`, welcome step helpers in `welcomeUtils.ts`, local welcome imagery in `welcomeAssets.ts`, repeated welcome UI in `components/`, and catalog-backed foundation screen content in `catalogApi.ts`, `screenDataTypes.ts`, `foundationScreenFallbacks.ts`, and `screens/CatalogContentScreen.tsx`.
