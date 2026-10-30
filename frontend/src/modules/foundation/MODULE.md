# Foundation

Owns splash, welcome, onboarding, app shell, home, explore, global search, saved aggregation, profile, and settings. Authentication and notifications remain dedicated modules surfaced inside foundation journeys.

Keep foundation routes and welcome step IDs in `foundationConstants.ts`, shell data in `homeApi.ts`, onboarding config and progress in `onboardingApi.ts`, and shared controls in `frontend/src/modules/shared/ui`.

## Screens

| Screen | Route | File |
|---|---|---|
| SplashScreen | `/`, `/splash` | `screens/SplashScreen.tsx` |
| WelcomeScreen | `/welcome` | `screens/WelcomeScreen.tsx` |
| OnboardingScreen | `/onboarding/*` | `screens/OnboardingScreen.tsx` |
| AppShellScreen | `/home`, `/explore`, `/chat`, `/community`, `/profile` | `screens/shell/AppShellScreen.tsx` |
| SearchScreen | `/search` | `screens/SearchScreen.tsx` |
| SavedScreen | `/saved` | `screens/SavedScreen.tsx` |
| SettingsScreen | `/settings` | `screens/SettingsScreen.tsx` |

## App shell (`screens/shell/`)

| File | Contents |
|---|---|
| `AppShellScreen.tsx` | Header, tab bar, per-`kind` data query, and dispatch to a shell |
| `HomeShell.tsx`, `ExploreShell.tsx`, `ChatShell.tsx`, `CommunityShell.tsx`, `ProfileShell.tsx` | One file per tab |
| `components.tsx` | Shared pieces: `PostCard`, `SectionTitle`, `FeedItem`, `Stat`, `ServiceGroup`, `SuperTile`, `MiniAction`, `ImageCard`, `InfoCard`, `UnreadNotificationDot` |
| `theme.ts` | Shell colour palette (`colors`) and styles (`s`) |
