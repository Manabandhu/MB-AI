---
name: manabandhu-foundation
description: Maintain ManaBandhu foundation journeys including splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, settings, and the canonical screen catalog. Use for core navigation or cross-module screen inventory changes.
---

# Foundation

## Module Purpose and Ownership

Owns the app shell, public onboarding journey, home/explore/search/saved/profile/settings screens, and the canonical screen catalog. Foundation aggregates module tiles and deep-links into business modules but does not duplicate their ownership.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/` | `StitchSplashScreen` | shell | loading |
| `/welcome` | `StitchWelcomeFlowScreen` | onboarding | normal |
| `/onboarding/*` | `StitchOnboardingScreen` | form | normal, success, permission |
| `/home` | `StitchAppShellScreen` (kind=`home`) | shell | loading, empty, error |
| `/explore` | `StitchAppShellScreen` (kind=`explore`) | catalog | loading, empty, error |
| `/search` | `SearchScreen` | form | loading, empty, error |
| `/saved` | `SavedScreen` | list | loading, empty, error |
| `/profile` | `StitchAppShellScreen` (kind=`profile`) | detail | loading, error |
| `/settings` | `SettingsScreen` | settings | normal |

## Component Inventory

- `StitchSplashScreen` - brand splash with auto-advance
- `StitchWelcomeFlowScreen` - welcome carousel and entry points
- `StitchOnboardingScreen` - multi-step onboarding with progress
- `StitchAppShellScreen` - adaptive shell with tab bar, header, and module shells
- `SearchScreen` - global search with filter chips
- `SavedScreen` - cross-module saved aggregation
- `SettingsScreen` - app preferences and account settings
- `CatalogContentScreen` - generic catalog screen driven by `screenId`
- `ScreenChrome` - auth/onboarding shell wrapper
- `Button` / `MiniAction` - primary/secondary action controls
- `ServiceGroup` / `SuperTile` - grouped module discovery grid
- `ImageCard` / `InfoCard` - horizontal and text cards
- `FeedItem` - compact feed list item
- `Stat` / `SectionTitle` - metrics and headings

## API Surface

- `getFoundationScreenContent(screenId)` -> `GET /api/v1/foundation/screens/{screenId}`
- Read-only demo endpoints for catalog-backed screens.

## Demo Fixtures

- `frontend/src/modules/foundation/foundationScreenFallbacks.ts` - demo payloads for all catalog-backed screens
- `frontend/src/modules/foundation/fixtures.ts` - onboarding and welcome copy

## State Patterns

- **Loading**: skeleton or spinner while initial content loads
- **Empty**: illustration, title, body, primary action when no data
- **Error**: error icon, title, body, retry action on failure
- **Success**: confirmation after onboarding complete
- **Offline**: banner indicating offline mode, cached data shown
- **Permission**: location and notification permission education during onboarding

## Navigation Actions and Cross-Module Links

- Tab navigation: Home, Explore, Search, Saved, Profile
- Quick actions on Home push to `/rooms`, `/rides`, `/community`, `/jobs`, `/chat`, `/events`, `/marketplace`, `/expenses`, `/immigration`, `/utilities`, `/safety`, `/referrals`
- Explore uses `SuperTile` and `ServiceGroup` to surface modules; future modules route to `/search` until implemented
- Deep links navigate to module home if intermediate state is missing

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/` are thin wrappers that delegate to module screens
- Stitch screens 1-27 are implemented as native Expo screens in `frontend/src/modules/foundation/screens/StitchPrototypeScreens.tsx`
- Shared controls live in `frontend/src/modules/shared/ui`
- Use `useQuery` for server state and `useState` for local UI state
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`
- `useAdaptiveLayout` governs responsive max-width and column count

## Accessibility and Responsive Behavior Rules

- Safe area insets always respected via `react-native-safe-area-context`
- Minimum touch target: 44x44pt
- All interactive elements need `accessibilityRole` and `accessibilityLabel`
- Keyboard-aware: scroll to focused input on form screens
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Animations respect `accessibility.reducedMotion`

## Current Implementation Status

- **Partial**: Splash, welcome, onboarding, app shell, search, saved, profile, and settings are implemented. Explore shell and catalog-backed screens are functional but rely on demo fallbacks pending backend content. Stitch prototype screens are translated from HTML and will be refined.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.
