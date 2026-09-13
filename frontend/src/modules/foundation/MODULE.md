# Foundation

Owns splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, and settings. Authentication and notifications remain dedicated modules surfaced inside foundation journeys.

Keep foundation routes and welcome step IDs in `foundationConstants.ts`, local welcome imagery in `welcomeAssets.ts`, catalog-backed foundation screen content in `catalogApi.ts`, `screenDataTypes.ts`, and `screens/CatalogContentScreen.tsx`, and shared controls in `frontend/src/modules/shared/ui`.

## Screens

| Screen | Route | File |
|---|---|---|
| StitchSplashScreen | `/`, `/splash` | `screens/StitchSplashScreen.tsx` |
| StitchWelcomeFlowScreen | `/welcome` | `screens/StitchWelcomeFlowScreen.tsx` |
| StitchOnboardingScreen | `/onboarding/*` | `screens/StitchOnboardingScreen.tsx` |
| StitchAppShellScreen | `/home`, `/explore`, `/chat`, `/community`, `/profile` | `screens/StitchAppShellScreen.tsx` |
| SearchScreen | `/search` | `screens/SearchScreen.tsx` |
| SavedScreen | `/saved` | `screens/SavedScreen.tsx` |
| SettingsScreen | `/settings` | `screens/SettingsScreen.tsx` |

## Components

| Component | File | Purpose |
|---|---|---|
| ScreenChrome | `screens/StitchAppShellScreen.tsx` | Auth/onboarding shell wrapper |
| Button | `screens/StitchAppShellScreen.tsx` | Primary/secondary button wrapper |
| MiniAction | `screens/StitchAppShellScreen.tsx` | Compact icon action tile |
| ServiceGroup | `screens/StitchAppShellScreen.tsx` | Grouped service grid |
| SuperTile | `screens/StitchAppShellScreen.tsx` | Featured service tile |
| ImageCard | `screens/StitchAppShellScreen.tsx` | Horizontal image card |
| InfoCard | `screens/StitchAppShellScreen.tsx` | Text info card |
| FeedItem | `screens/StitchAppShellScreen.tsx` | Compact feed list item |
| Stat | `screens/StitchAppShellScreen.tsx` | Metric stat display |
| SectionTitle | `screens/StitchAppShellScreen.tsx` | Section heading |

## Shells

| Shell | File | Purpose |
|---|---|---|
| HomeShell | `screens/StitchAppShellScreen.tsx` | Home dashboard feed |
| ChatShell | `screens/StitchAppShellScreen.tsx` | Chat conversation list |
| ExploreShell | `screens/StitchAppShellScreen.tsx` | Module discovery grid |
| CommunityShell | `screens/StitchAppShellScreen.tsx` | Community hubs and activity |
| ProfileShell | `screens/StitchAppShellScreen.tsx` | User profile and stats |
