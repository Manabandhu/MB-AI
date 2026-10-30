---
name: manabandhu-utilities
description: Maintain ManaBandhu package tracking, nearby services, emergency resources, provider links, location consent, freshness, and external integrations. Use for any change under the utilities module.
---

# Utilities

## Module Purpose and Ownership

Owns package tracking, nearby services, emergency resources, provider links, location consent, freshness, and external-service boundaries.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/utilities` | `UtilitiesHomeScreen` | catalog | loading, empty, error |
| `/utilities/packages` | `PackageTrackingScreen` | list | loading, empty, error |
| `/utilities/nearby` | `NearbyScreen` | list | loading, empty, error |
| `/utilities/emergency` | `EmergencyResourcesScreen` | list | loading, empty, error |

## Component Inventory

- `UtilitiesHomeScreen` - `Screen`/`ScreenHeader`, three shortcut `Card`s, searchable `/utilities/home` items (`TextField` with `leadingIcon` and a clear `IconButton`) in a `ResponsiveGrid`
- `PackageTrackingScreen` - your packages with `StatusBadge` (`packageStatus`, case-insensitive), search, and an "Add package" `BottomSheet` (tracking number, carrier chips/other, status chips, optional `DateTimeField` date)
- `NearbyScreen` - real search (`TextField`) plus category radio chips over `GET /utilities/nearby`; each place has Directions (maps search URL) and Call (`tel:`). No location permission UI: the endpoint is not location-aware
- `EmergencyResourcesScreen` - Call 911 card, then resources with Call (`tel:`) and Directions; empty copy differs from the error state
- Pure helpers: `utilities/utils/utilitiesFormat.ts` (`PACKAGE_STATUSES`, `packageStatus`, `matchesSearch`, `formatDistance`, `telLink`, `mapsSearchUrl`, `trackingNumberError`), tested in `frontend/test/safetyUtilities.test.mjs`

## API Surface

- `getUtilitiesHome()` -> `GET /api/v1/utilities/home` (`CatalogScreenContent`)
- `getPackages()` -> `GET /api/v1/utilities/packages` (`PackageTracking`: `trackingNumber`, `carrier`, `status`, `estimatedDelivery`, `lastUpdate`)
- `createPackage({ trackingNumber, carrier, status, estimatedDelivery? })` -> `POST /api/v1/utilities/packages`
- `getNearby()` -> `GET /api/v1/utilities/nearby` (`NearbyPlace`: `name`, `category`, `address`, `distanceKm?`, `rating?`, `phone?`)
- `getEmergencyResources()` -> `GET /api/v1/utilities/emergency` (`EmergencyResource`: `name`, `category`, `address`, `phone?`, `hours?`, `description`)

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` while utility data loads
- **Empty**: `EmptyState` when no packages, nearby places, or emergency resources exist
- **Error**: `ErrorState` with retry action
- **Success**: not applicable
- **Offline**: none; failures show `ErrorState`
- **Permission**: not applicable (no device location is used)

## Navigation Actions and Cross-Module Links

- Home actions: Packages, Nearby, Emergency
- Every sub-screen has a back button falling back to `/utilities`
- Phone numbers and directions open through `Linking`; failures surface via `showError`

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/utilities*` are thin wrappers. `/utilities`, `/utilities/nearby` and `/utilities/emergency` are public (their endpoints are public in `SecurityConfig`, and emergency help must work signed out); only `/utilities/packages` calls `useRequireAuth('/sign-in')`
- Uses `useQuery` for all utility data fetching
- Providers are behind typed adapters with timeouts, retries, and caching
- Location is requested only when needed
- External links are labeled with source and freshness
- Styling uses Tamagui primitives from `@/modules/shared/ui` with design-system tokens (Uniwind/Tailwind were removed 2026-10-30)

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected
- Color is not the only indicator of state

## Current Implementation Status

- **Partial**: Home via `FeatureScreen`, package tracking, nearby, and emergency resources screens are UI-complete. Real provider integration, location consent flow, and offline fallbacks are pending backend wiring.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/utilities` with packages, nearby places, emergency resources, and Flyway migration V12.

- Fallback cleanup: deleted `utilitiesFallbacks.ts` and removed inline fallbacks from `UtilitiesHomeScreen`, `NearbyScreen`, `EmergencyResourcesScreen`, and `PackageTrackingScreen` in favor of live backend endpoints, loading states, and error/empty states; added resilient `DEFAULT_UTILITIES_DATA` fallback to `UtilitiesHomeScreen` to eliminate mobile network-blocking errors.
- Diaspora & Utilities Hub overhaul: replaced generic `FeatureScreen` placeholder in `UtilitiesHomeScreen.tsx` with dedicated Diaspora Community Services & Utilities screen featuring live Metro Texas search, quick shortcut buttons (Packages, Nearby Map, Emergency), community spotlight move-in bundle card, category filter pills (Tiffin & Dabba, Groceries, Electricity & Wifi, Puja & Temples, Luggage & Courier), rich service cards with reviews and ratings, and interactive provider contact modal. Matching Stitch screen: `933f721ea1604a1fb5f1ca039bbf8703`.
- Repo-Wide Code Review & Defect Remediation: Audited `UtilitiesHomeScreen.tsx` for touch targets and routing safety, removed hardcoded fallbacks in favor of live category queries, and verified empty/error lifecycle states.
- Security & correctness hardening (2026-10): Only `/api/v1/utilities/{home,nearby,emergency}` are public; package tracking requires a JWT. Screens use typed `Href` routes. Removed the unreachable `UtilitiesGraphqlController`.
- No invented data (2026-10): removed `SERVICES_DATA` (fake providers, ratings, prices, phone number), category pills, the move-in banner, and the fake "Contact Request Sent"/"Saved" alerts from `UtilitiesHomeScreen`. It renders `GET /api/v1/utilities/home` title/subtitle/items with search, quick links, and loading/error states; backend home metrics are not shown because they are still hard-coded server-side.
- Screen metrics are computed from the database (2026-10): `GET /api/v1/utilities/home` is built by `UtilitiesContentService`; nearby-place and emergency-resource counts are public, the package count is the caller's own (omitted when anonymous). Home metrics are no longer hard-coded.
- Public API: `utilities/index.ts` exports `moduleMeta` (launcher entry).
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 fix (2026-10-10): `POST /utilities/packages` parses `status` case-insensitively with `TrackingStatus.parse`; unknown values are 400 instead of 500.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['packages', 'package tracking', 'delivery', 'nearby services', 'emergency numbers']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- P0/P1 pass (2026-10-13): frontend types now match the backend entities (the old `title/body/meta` types made every list blank and search crash). Removed the fake Nearby search (a `Text` that set "Search nearby...") and the "Filter" button that toggled a fake location-permission banner; added a real search and category filter. Packages gain an Add form and status badges; emergency resources are callable/openable. UtilitiesHome dropped ~290 lines of dead styles and the `✕` text clear button. `/utilities/packages` is guarded; home, nearby and emergency stay public.
