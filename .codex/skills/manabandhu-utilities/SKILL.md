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
| `/utilities/nearby` | `NearbyScreen` | map | loading, empty, error, permission |
| `/utilities/emergency` | `EmergencyResourcesScreen` | list | loading, empty, error |

## Component Inventory

- `UtilitiesHomeScreen` - catalog screen using `FeatureScreen`
- `PackageTrackingScreen` - list screen with `SearchBar`, timeline rows, and `SectionHeader`
- `NearbyScreen` - list screen with permission banner, map-style filter, and `SectionHeader`
- `EmergencyResourcesScreen` - list screen with warning banner and `SectionHeader`
- Shared: `FeatureScreen`, `ScreenShell`, `SearchBar`, `ListScreen`, `Card`, `AppButton`, `SectionHeader`, `MapView`, `MapPin`, `FilterBar`, `Timeline`, `Banner`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `getUtilitiesHome()` -> `GET /api/v1/utilities/home`
- `getPackages()` -> `GET /api/v1/utilities/packages`
- `getNearby()` -> `GET /api/v1/utilities/nearby`
- `getEmergencyResources()` -> `GET /api/v1/utilities/emergency`

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` while utility data loads
- **Empty**: `EmptyState` when no packages, nearby places, or emergency resources exist
- **Error**: `ErrorState` with retry action
- **Success**: not applicable
- **Offline**: offline banner with cached data
- **Permission**: permission banner for nearby screen with fallback list

## Navigation Actions and Cross-Module Links

- Home actions: Packages, Nearby, Emergency
- Package detail -> back to packages
- Nearby place detail -> back to nearby
- Emergency resources -> external links with disclaimer

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/utilities/` are thin wrappers
- Uses `useQuery` for all utility data fetching
- Providers are behind typed adapters with timeouts, retries, and caching
- Location is requested only when needed
- External links are labeled with source and freshness
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`

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

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.
- Fallback cleanup: deleted `utilitiesFallbacks.ts` and removed inline fallbacks from `UtilitiesHomeScreen`, `NearbyScreen`, `EmergencyResourcesScreen`, and `PackageTrackingScreen` in favor of live backend endpoints, loading states, and error/empty states.
