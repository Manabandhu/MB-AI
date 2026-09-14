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
| `/onboarding/what-brings-you-here` | `StitchOnboardingScreen` (kind=`goals`) | onboarding | normal, loading, error |
| `/onboarding/location` | `StitchOnboardingScreen` (kind=`location`) | onboarding | normal, loading, error |
| `/onboarding/languages` | `StitchOnboardingScreen` (kind=`languages`) | onboarding | normal, loading, error |
| `/onboarding/interests` | `StitchOnboardingScreen` (kind=`interests`) | onboarding | normal, loading, error |
| `/onboarding/profile-photo` | `StitchOnboardingScreen` (kind=`profile-photo`) | onboarding | normal, loading, error |
| `/onboarding/notifications` | `StitchOnboardingScreen` (kind=`notifications`) | onboarding | normal, loading, error |
| `/onboarding/trust-and-safety` | `StitchOnboardingScreen` (kind=`trust-and-safety`) | onboarding | normal, loading, error |
| `/onboarding/complete` | `StitchOnboardingScreen` (kind=`complete`) | onboarding | normal, success |
| `/home` | `StitchAppShellScreen` (kind=`home`) | shell | loading, empty, error |
| `/explore` | `StitchAppShellScreen` (kind=`explore`) | catalog | loading, empty, error |
| `/search` | `SearchScreen` | form | loading, empty, error |
| `/saved` | `SavedScreen` | list | loading, empty, error |
| `/profile` | `StitchAppShellScreen` (kind=`profile`) | detail | loading, error |
| `/settings` | `SettingsScreen` | settings | normal |

## Component Inventory

- `StitchSplashScreen` - brand splash with auto-advance, 2.2s guaranteed safety fallback timer, tap-to-advance, and active ActivityIndicator in status row
- `StitchWelcomeFlowScreen` - welcome carousel and entry points
- `StitchOnboardingScreen` - multi-step onboarding with progress
- `StitchAppShellScreen({ kind })` - unified tabbed shell for home/explore/chat/community/profile
  - `HomeShell` - greeting header, location chip, search bar, 2×4 quick-action grid (Rooms/Rides/Jobs/Community/Chat/Events/Market/Safety), live stats pill row, Rooms Near You horizontal scroll, Community Feed post cards, Hot Job Referrals rows
  - `ExploreShell` - category filter chips, featured event card, 2-col explore item grid (rooms/jobs/events)
  - `ChatShell` - pinned alert, conversation list rows with online dots, unread badges, timestamps
  - `CommunityShell` - tab bar, story bubbles, trending topic chips, post cards with reactions, FAB
  - `ProfileShell` - gradient indigo hero, stats row (Connections/Posts/Referrals), trust badges, completion progress card, quick links, account settings, sign-out
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
- `getOnboardingConfig()` -> `GET /api/v1/onboarding/config`
- `getOnboardingProgress()` -> `GET /api/v1/onboarding/progress`
- `saveOnboardingStep(payload)` -> `POST /api/v1/onboarding/step`
- `completeOnboarding()` -> `POST /api/v1/onboarding/complete`
- Read-only demo endpoints for catalog-backed screens.

## Demo Fixtures

- Legacy demo fixtures removed from catalog and shell screens; screens use live backend endpoints (`/api/v1/foundation/screens/{screenId}`), live Supabase queries, dynamic metrics, and community trust pillars.
- `frontend/src/modules/foundation/fixtures.ts` has been removed.

## State Patterns

- **Loading**: skeleton or spinner while initial content loads
- **Empty**: illustration, title, body, primary action when no data
- **Error**: error icon, title, body, retry action on failure
- **Success**: confirmation after onboarding complete
- **Offline**: banner indicating offline mode, cached data shown
- **Permission**: location and notification permission education during onboarding

Splash navigation waits for the Expo Router root navigation state to expose its key, then defers `router.replace` by one event-loop tick so the root navigator has completed its first mount.

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

- Recent refactor: `StitchAppShellScreen` now dispatches the correct shell API per `kind` (home/chat/explore/community/profile) instead of always calling `getHomeShell`. Foundation screens now use `useAdaptiveLayout`. Removed dead `StitchPrototypeScreens.tsx` barrel and consolidated duplicate fallback data between `homeShellFallbacks.ts` and `foundationScreenFallbacks.ts`.

- Recent backend changes: expanded `FoundationContentService` switch to include `home`, `chat`, `community`, `explore`, `search`, `saved`, `profile`, and `settings` screen IDs (previously only handled `onboarding`).
- Recent shell fallback fix: `StitchAppShellScreen` `useQuery` now uses `placeholderData: homeShellFallbacks[kind]` with `retry: false`, removing the `LoadingState`/`ErrorState` branches in favor of falling back to `homeShellFallbacks[kind]` directly.
- Recent welcome flow fix: wrapped `StitchWelcomeFlowScreen` in `ScrollView` with responsive container constraints (`maxWidth: 440`, bounded visual height) to prevent action buttons from being pushed below viewport fold on laptop and desktop screens; made `Skip` an accessible, interactive pressable on non-final slides that navigates directly to `/sign-in`.
- Recent Stitch alignment: `StitchSplashScreen` upgraded to match Stitch screen `6d3ab1cb367740c8a71cb6a58e7f6f65` with glowing brand emblem badge, progress loader, and ecosystem trust footer; `StitchWelcomeFlowScreen` aligned with Stitch screen `e8c095a7b430406e89177e71154883a9` featuring hero community trust visual, 4 core pillar cards (Rooms, Rides, Jobs, Events), stepper pagination, and primary `Get Started →` CTA.
- Recent Welcome flow & website design enhancement: `StitchWelcomeFlowScreen` upgraded with an interactive multi-slide carousel featuring 4 feature pillar slides (Verified Rooms, Carpools, Tech Referrals, Community Hub) with previous/next controls, direct category navigation pills, animated clickable indicator dots, and a 4.5s auto-advance timer with interaction pause. On desktop web (viewport width >= 768px), provides a complete responsive website experience with a top navigation bar, 2-column hero with value checkpoints and live trust metrics ticker, interactive carousel device preview, full feature matrix grid, safety pledge banner, and footer.
- Recent icon & catalog update: updated `StitchWelcomeFlowScreen` with exact vector icons from `AppIcon` (`home`, `car`, `briefcase`, `community`, `check`, `shield`, `star`, `sparks`, `chevron-left`, `chevron-right`); removed magic link route entry from `screen-catalog.ts` per design update.
- Recent brand & community positioning update: updated `StitchWelcomeFlowScreen` and foundation fallbacks to position ManaBandhu for the broader Desi community (removing narrow diaspora restrictions); eliminated all mentions of "brokerage" in favor of direct community listings and transparent pricing; removed the green verified checkmark beside the "ManaBandhu" title in navigation and top bars.
- Inclusivity & Language expansion: updated `StitchOnboardingScreen` and `fixtures.ts` to feature broad multi-lingual Desi language selections (`English`, `Hindi`, `Telugu`, `Tamil`, `Kannada`, `Punjabi`, `Gujarati`, `Bengali`, `Spanish`) ensuring no single community is highlighted exclusively.




- Style flattening on Link asChild: Wrapped Pressable style in StyleSheet.flatten inside HomeShell quick-action tiles to prevent Expo Router Slot invariant errors.
- HomeShell Discovery Integration: Connected the greeting row location chip (`Austin, TX · 847 Rooms`), search bar placeholder (`Austin, TX · 847 rooms, flatmates, rides...`), and live stats pills to directly route into `/rooms` for seamless zero-brokerage room discovery.
- Fallback cleanup: deleted `foundationScreenFallbacks.ts` and `homeShellFallbacks.ts`, removed fallback placeholders from `CatalogContentScreen` and `StitchAppShellScreen` in favor of live backend endpoints, responsive loading states, and error states.
- Hardcoded data cleanup: deleted `fixtures.ts`, removed hardcoded mock feeds/stats from `StitchAppShellScreen`, and removed fake personas/testimonials ("Sravan K.", "Madhu V.", "Ananya R.", "Karthik N.") and static metrics from `StitchWelcomeFlowScreen` carousel slides in favor of authentic community value propositions and trust badges.
- Route link fixes: updated `quickActions` and `profileLinks` in `StitchAppShellScreen.tsx` to route directly to dedicated feature screens (`/events`, `/marketplace`, `/safety`, `/events/mine`, `/immigration`, `/notifications/settings`) instead of legacy `/search` placeholders.
- Screen modernization & foldable responsiveness: replaced legacy `CatalogContentScreen` fallbacks with dedicated Stitch screens for `SearchScreen.tsx` (unified search across rooms, events, marketplace, and jobs), `SavedScreen.tsx` (tabbed saved items), and `SettingsScreen.tsx` (profile card, notification toggles, safety links, sign-out); updated `qaGrid` and `qaTile` in `StitchAppShellScreen.tsx` with responsive widths and auto-fitting text scaling for narrow fold screens (280-340px) and desktop layouts; resolved horizontal ScrollView cross-axis stretching on `SearchScreen` and `SavedScreen` filter chips with `flexGrow: 0` and `alignItems: 'center'`.
- Unified design system & Settings standardization: Aligned `SettingsScreen.tsx` to the unified ManaBandhu Modern Vibrant design tokens (`#431ebe` Royal Indigo, `#00696b` Teal, `#ff7e33` Sunset Orange, `#faf8ff` background), updated screen catalog and foundation references.
- Dynamic Splash Screen Animation: overhauled `StitchSplashScreen.tsx` with high-polish entrance fading, scale-up entrance, breathing outer glow pulse loop (`Animated.loop`), continuous breathing pulse dot loop, and dynamic progress bar fill animation (0% to 100% over 1700ms) with seamless auto-advance on complete. Matching Stitch screen: `6d3ab1cb367740c8a71cb6a58e7f6f65`.
- Bottom Navigation Bar Order & Dynamic Shell Architecture: reordered main navigation tabs to `Home` -> `Community` -> `Explore` -> `Chat` -> `Profile`. Overhauled `ExploreShell` into the master capabilities directory housing all application modules grouped by domain (Living, Careers, Community, Desi Essentials, Safety) with live module search and domain filters. Overhauled `HomeShell` with dynamic user-behavior tracking via `useUserActivityStore` and memoized `useDynamicModules` hook that automatically ranks and presents the user's most frequently and recently accessed modules with starter defaults for new members, eliminating render loop depth errors.
- Dynamic DB-Driven First-Time User Onboarding Flow: implemented full 8-step onboarding flow across Stitch MCP design generation, PostgreSQL dynamic configuration (`onboarding_steps`, `onboarding_options`, `user_onboarding_progress`), Spring Boot API (`/api/v1/onboarding/*`), and Expo React Native (`StitchOnboardingScreen`). Step options (goals, diaspora metro hubs, languages, community interests, notification categories, trust pledge items) are strictly zero-hardcoded and fetched dynamically from the database. Progress across all 8 steps is persisted to `user_onboarding_progress`, supporting session resumption and multiplatform adaptive layout (Mobile <600px, Desktop Web >=1024px) with ManaBandhu Modern Vibrant tokens (`#431ebe` primary, `#e5deff` primarySoft, `#131b2e` ink, `#00696b` teal).
- Screen Catalog Rooms Update: Added Room Inquiry screen (`/rooms/[roomId]/inquiry`) to `screen-catalog.ts` completing the 10-screen rooms route inventory.
- Foundation Content DB Metrics: `FoundationContentService.java` upgraded from hardcoded static metrics to live PostgreSQL database counts using Spring Data `JdbcTemplate` with safe fallback for active rooms, active rides, conversations, community posts, and saved favorites.
- Repo-Wide Defect Remediation: Standardized SearchScreen and SavedScreen category queries and filter interactions, enforced `keyboardShouldPersistTaps="handled"` on Search bar inputs, and aligned screen count exports.

