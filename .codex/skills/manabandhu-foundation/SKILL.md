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
| `/` | `SplashScreen` | shell | loading |
| `/welcome` | `WelcomeScreen` | onboarding | normal |
| `/onboarding/what-brings-you-here` | `OnboardingScreen` (kind=`goals`) | onboarding | normal, loading, error |
| `/onboarding/location` | `OnboardingScreen` (kind=`location`) | onboarding | normal, loading, error |
| `/onboarding/languages` | `OnboardingScreen` (kind=`languages`) | onboarding | normal, loading, error |
| `/onboarding/interests` | `OnboardingScreen` (kind=`interests`) | onboarding | normal, loading, error |
| `/onboarding/profile-photo` | `OnboardingScreen` (kind=`profile-photo`) | onboarding | normal, loading, error |
| `/onboarding/notifications` | `OnboardingScreen` (kind=`notifications`) | onboarding | normal, loading, error |
| `/onboarding/trust-and-safety` | `OnboardingScreen` (kind=`trust-and-safety`) | onboarding | normal, loading, error |
| `/onboarding/complete` | `OnboardingScreen` (kind=`complete`) | onboarding | normal, success |
| `/home` | `AppShellScreen` (kind=`home`) | shell | loading, empty, error |
| `/explore` | `AppShellScreen` (kind=`explore`) | catalog | loading, empty, error |
| `/search` | `SearchScreen` (optional `?q=` pre-fills the query) | form | loading, empty, error |
| `/saved` | `SavedScreen` | list | loading, empty, error |
| `/profile` | `AppShellScreen` (kind=`profile`) | detail | loading, error |
| `/settings` | `SettingsScreen` | settings | normal |

## Component Inventory

- `SplashScreen` - brand splash with auto-advance, 2.2s guaranteed safety fallback timer, tap-to-advance, and active ActivityIndicator in status row
- `WelcomeScreen` - welcome carousel and entry points
- `OnboardingScreen` - multi-step onboarding with progress
- `AppShellScreen({ kind })` (`screens/shell/`) - unified tabbed shell for home/explore/chat/community/profile
  - `HomeShell` - greeting header, location chip, search bar, 2×4 quick-action grid (Rooms/Rides/Jobs/Community/Chat/Events/Market/Safety), live stats pill row, Rooms Near You horizontal scroll, Community Feed post cards, Hot Job Referrals rows
  - `ExploreShell` - category filter chips, featured event card, 2-col explore item grid (rooms/jobs/events)
  - `ChatShell` - pinned alert, conversation list rows with online dots, unread badges, timestamps
  - `CommunityShell` - tab bar, story bubbles, trending topic chips, post cards with reactions, FAB
  - `ProfileShell` - gradient indigo hero, stats row (Connections/Posts/Referrals), trust badges, completion progress card, quick links, account settings, sign-out
- `AppShellScreen` - adaptive shell with tab bar, header, and module shells
- `SearchScreen` - global search with filter chips
- `SavedScreen` - cross-module saved aggregation
- `SettingsScreen` - app preferences, notifications, safety links, account settings, and Map Provider selector (Google Maps vs Apple Maps persisted in `useMapPreferencesStore`)
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

- Tab navigation: Home, Explore, Community, Chat, Profile (`shell/navigation/tabs.ts`)
- Quick actions on Home push to `/rooms`, `/rides`, `/community`, `/jobs`, `/chat`, `/events`, `/marketplace`, `/expenses`, `/immigration`, `/utilities`, `/safety`, `/referrals`
- Explore uses `SuperTile` and `ServiceGroup` to surface modules; future modules route to `/search` until implemented
- Deep links navigate to module home if intermediate state is missing

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/` are thin wrappers that delegate to module screens
- Foundation screens live in `frontend/src/modules/foundation/screens/` (app shell in `screens/shell/`)
- Shared controls live in `frontend/src/modules/shared/ui`
- Use `useQuery` for server state and `useState` for local UI state
- Styling uses Tamagui primitives from `@/modules/shared/ui` with design-system tokens (Uniwind/Tailwind were removed 2026-10-30)
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

- Recent refactor: `AppShellScreen` now dispatches the correct shell API per `kind` (home/chat/explore/community/profile) instead of always calling `getHomeShell`. Foundation screens now use `useAdaptiveLayout`. Removed dead `StitchPrototypeScreens.tsx` barrel and consolidated duplicate fallback data between `homeShellFallbacks.ts` and `foundationScreenFallbacks.ts`.

- Recent backend changes: expanded `FoundationContentService` switch to include `home`, `chat`, `community`, `explore`, `search`, `saved`, `profile`, and `settings` screen IDs (previously only handled `onboarding`).
- Recent shell fallback fix: `AppShellScreen` `useQuery` now uses `placeholderData: homeShellFallbacks[kind]` with `retry: false`, removing the `LoadingState`/`ErrorState` branches in favor of falling back to `homeShellFallbacks[kind]` directly.
- Recent welcome flow fix: wrapped `WelcomeScreen` in `ScrollView` with responsive container constraints (`maxWidth: 440`, bounded visual height) to prevent action buttons from being pushed below viewport fold on laptop and desktop screens; made `Skip` an accessible, interactive pressable on non-final slides that navigates directly to `/sign-in`.
- Recent Stitch alignment: `SplashScreen` upgraded to match Stitch screen `6d3ab1cb367740c8a71cb6a58e7f6f65` with glowing brand emblem badge, progress loader, and ecosystem trust footer; `WelcomeScreen` aligned with Stitch screen `e8c095a7b430406e89177e71154883a9` featuring hero community trust visual, 4 core pillar cards (Rooms, Rides, Jobs, Events), stepper pagination, and primary `Get Started →` CTA.
- Recent Welcome flow & website design enhancement: `WelcomeScreen` upgraded with an interactive multi-slide carousel featuring 4 feature pillar slides (Verified Rooms, Carpools, Tech Referrals, Community Hub) with previous/next controls, direct category navigation pills, animated clickable indicator dots, and a 4.5s auto-advance timer with interaction pause. On desktop web (viewport width >= 768px), provides a complete responsive website experience with a top navigation bar, 2-column hero with value checkpoints and live trust metrics ticker, interactive carousel device preview, full feature matrix grid, safety pledge banner, and footer.
- Recent icon & catalog update: updated `WelcomeScreen` with exact vector icons from `AppIcon` (`home`, `car`, `briefcase`, `community`, `check`, `shield`, `star`, `sparks`, `chevron-left`, `chevron-right`); removed magic link route entry from `screen-catalog.ts` per design update.
- Recent brand & community positioning update: updated `WelcomeScreen` and foundation fallbacks to position ManaBandhu for the broader Desi community (removing narrow diaspora restrictions); eliminated all mentions of "brokerage" in favor of direct community listings and transparent pricing; removed the green verified checkmark beside the "ManaBandhu" title in navigation and top bars.
- Inclusivity & Language expansion: updated `OnboardingScreen` and `fixtures.ts` to feature broad multi-lingual Desi language selections (`English`, `Hindi`, `Telugu`, `Tamil`, `Kannada`, `Punjabi`, `Gujarati`, `Bengali`, `Spanish`) ensuring no single community is highlighted exclusively.




- Style flattening on Link asChild: Wrapped Pressable style in StyleSheet.flatten inside HomeShell quick-action tiles to prevent Expo Router Slot invariant errors.
- HomeShell Discovery Integration: Connected the greeting row location chip (`Austin, TX · 847 Rooms`), search bar placeholder (`Austin, TX · 847 rooms, flatmates, rides...`), and live stats pills to directly route into `/rooms` for seamless zero-brokerage room discovery.
- Fallback cleanup: deleted `foundationScreenFallbacks.ts` and `homeShellFallbacks.ts`, removed fallback placeholders from `CatalogContentScreen` and `AppShellScreen` in favor of live backend endpoints, responsive loading states, and error states.
- Hardcoded data cleanup: deleted `fixtures.ts`, removed hardcoded mock feeds/stats from `AppShellScreen`, and removed fake personas/testimonials ("Sravan K.", "Madhu V.", "Ananya R.", "Karthik N.") and static metrics from `WelcomeScreen` carousel slides in favor of authentic community value propositions and trust badges.
- Route link fixes: updated `quickActions` and `profileLinks` in `AppShellScreen.tsx` to route directly to dedicated feature screens (`/events`, `/marketplace`, `/safety`, `/events/mine`, `/immigration`, `/notifications/settings`) instead of legacy `/search` placeholders.
- Screen modernization & foldable responsiveness: replaced legacy `CatalogContentScreen` fallbacks with dedicated Stitch screens for `SearchScreen.tsx` (unified search across rooms, events, marketplace, and jobs), `SavedScreen.tsx` (tabbed saved items), and `SettingsScreen.tsx` (profile card, notification toggles, safety links, sign-out); updated `qaGrid` and `qaTile` in `AppShellScreen.tsx` with responsive widths and auto-fitting text scaling for narrow fold screens (280-340px) and desktop layouts; resolved horizontal ScrollView cross-axis stretching on `SearchScreen` and `SavedScreen` filter chips with `flexGrow: 0` and `alignItems: 'center'`.
- Unified design system & Settings standardization: Aligned `SettingsScreen.tsx` to the unified ManaBandhu Modern Vibrant design tokens (`#431ebe` Royal Indigo, `#00696b` Teal, `#ff7e33` Sunset Orange, `#faf8ff` background), updated screen catalog and foundation references.
- Dynamic Splash Screen Animation: overhauled `SplashScreen.tsx` with high-polish entrance fading, scale-up entrance, breathing outer glow pulse loop (`Animated.loop`), continuous breathing pulse dot loop, and dynamic progress bar fill animation (0% to 100% over 1700ms) with seamless auto-advance on complete. Matching Stitch screen: `6d3ab1cb367740c8a71cb6a58e7f6f65`.
- Bottom Navigation Bar Order & Dynamic Shell Architecture: reordered main navigation tabs to `Home` -> `Community` -> `Explore` -> `Chat` -> `Profile`. Overhauled `ExploreShell` into the master capabilities directory housing all application modules grouped by domain (Living, Careers, Community, Desi Essentials, Safety) with live module search and domain filters. Overhauled `HomeShell` with dynamic user-behavior tracking via `useUserActivityStore` and memoized `useDynamicModules` hook that automatically ranks and presents the user's most frequently and recently accessed modules with starter defaults for new members, eliminating render loop depth errors.
- Dynamic DB-Driven First-Time User Onboarding Flow: implemented full 8-step onboarding flow across Stitch MCP design generation, PostgreSQL dynamic configuration (`onboarding_steps`, `onboarding_options`, `user_onboarding_progress`), Spring Boot API (`/api/v1/onboarding/*`), and Expo React Native (`OnboardingScreen`). Step options (goals, diaspora metro hubs, languages, community interests, notification categories, trust pledge items) are strictly zero-hardcoded and fetched dynamically from the database. Progress across all 8 steps is persisted to `user_onboarding_progress`, supporting session resumption and multiplatform adaptive layout (Mobile <600px, Desktop Web >=1024px) with ManaBandhu Modern Vibrant tokens (`#431ebe` primary, `#e5deff` primarySoft, `#131b2e` ink, `#00696b` teal).
- Screen Catalog Rooms Update: Added Room Inquiry screen (`/rooms/[roomId]/inquiry`) to `screen-catalog.ts` completing the 10-screen rooms route inventory.
- Foundation Content DB Metrics: `FoundationContentService.java` upgraded from hardcoded static metrics to live PostgreSQL database counts using Spring Data `JdbcTemplate` with safe fallback for active rooms, active rides, conversations, community posts, and saved favorites.
- Repo-Wide Defect Remediation: Standardized SearchScreen and SavedScreen category queries and filter interactions, enforced `keyboardShouldPersistTaps="handled"` on Search bar inputs, and aligned screen count exports.
- ChatShell Cross-Module Avatars: Updated `AppShellScreen.tsx` `ChatShell` to display dedicated 🏠 Room Inquiry and 🚗 Ride Coordination icons for `ROOM_INQUIRY` and `RIDE_TEMP` conversations.
- Mobile App Shell Header Removal & Edge-to-Edge Navigation Dock: Removed the redundant top header across all mobile shell screens (`home`, `explore`, `community`, `chat`, `profile`), reserving the top header strictly for desktop viewports (`isDesktop`). On Home, the notification bell and avatar are integrated beside the greeting row; on Community and Chat, native in-screen headers ("Community" / "Messages") provide direct context; on Profile, the full-bleed profile hero provides high-impact presence; on Explore, the capabilities directory leads directly into the search bar and 2-column grid. Adjusted scroll container padding (`paddingTop: !isDesktop ? Math.max(insets.top, 12) + 6 : space.x6`) to hug camera cutouts/Dynamic Island cutouts without overlapping, with an edge-to-edge bottom navigation dock (`width: '100%'`, `paddingBottom: insets.bottom`) eliminating wasted dead space.
- Global Location Selector & App-Wide Sync: Implemented universal `useLocationStore` in `frontend/src/lib/locationStore.ts` with persistent multi-platform storage (`SecureStore` on native, `localStorage` on web), defaulting to Austin, TX and pre-populated with popular Desi tech hubs. Replaced the Home screen greeting location chip with an interactive selector opening `LocationSelectorModal` (`frontend/src/modules/foundation/components/LocationSelectorModal.tsx`). Equipped with dynamic 3-character threshold searching across 20,000+ US cities (`searchAllUSCities`), instant prefix/contains matching, checkmark state, and synchronized reactive state across Home, Rooms (`RoomsScreen.tsx`), Rides (`RidesScreen.tsx`), and Jobs (`JobsHomeScreen.tsx`).
- Explore Screen 2-Column Grid & View Mode: Replaced single-column vertical list on mobile in `ExploreShell` with a clean, high-density 2-column card grid (`exploreTileGrid` / `exploreTileCard`), featuring category badge pills, squircle pastel icon containers, 2-line descriptions, and explicit "Explore →" action affordances. Added an interactive `Grid` / `List` view switcher in the section header, defaulting to Grid on mobile for rapid scannability and lower scrolling fatigue.
- Location Selector Modal Keyboard Stability: Stabilized `LocationSelectorModal` bottom sheet with `KeyboardAvoidingView`, fixed minimum height (460px), `minHeight: 240` on content container, and `StyleSheet.absoluteFill` dismiss backdrop so the sheet never collapses or drops behind the virtual keyboard when typing specific search queries with few or single results.
- Security & correctness hardening (2026-10): Onboarding never uses a shared demo user: `GET /api/v1/onboarding/config` is public, while progress/step/complete require a JWT. Signed-out visitors keep answers in memory on the device (`guestProgress` in `onboardingApi.ts`). Array answers bind as native `text[]` parameters and scalar answers are coerced to bounded text. Typed `Href` replaces `as any` in `SavedScreen`/`SearchScreen`.
- No invented personal data (2026-10): `ProfileShell` renders backend `metrics` exactly as sent (nothing when empty), has no email fallback, and shows trust badges only from the Supabase user (`Email verified` from `email_confirmed_at`, `Phone verified` from `phone_confirmed_at`); the static "ID Verified"/"Safe Connect"/"Community Member" badges were removed. The shell bell dot shows only when `GET /api/v1/notifications/inbox` has unread items. `SavedScreen` lists the caller's real saved rooms (`/rooms/favorites`), rides (`/rides/saved`) and events (`/events/saved`) instead of the first public listings, with loading/error/empty states. `SearchScreen` surfaces list errors instead of `.catch(() => [])` and drops invented location/company fallbacks. `SettingsScreen` drops the fake "Verified Bandhu" badge, placeholder email and unsaved notification toggles (links to `/notifications/settings`).
- Screen metrics are computed from the database (2026-10): `FoundationContentService.screen(id, Optional<Actor>)` uses COUNT queries only (active rooms, upcoming active rides, communities, posts, onboarding steps, upcoming published events); chat and saved counts are the caller's own and omitted for anonymous viewers; failed counts are omitted (no fallback numbers). Profile, settings and search show no metrics (there is no profiles table to derive "profile strength"/"trust checks"); the fake saved room/ride items were replaced with links to `/rooms/saved` and `/marketplace/saved`.
- Welcome, splash, onboarding (2026-10): `/welcome` is a swipeable four-slide pager (no auto-advance) with "Get started" and "I already have an account" always visible; artwork is sized from the remaining height so iPhone SE through Pro Max fit, and ≥820pt widths use a two-column layout. Splash leaves 500 ms after the session check (was 1.4 s) and routes signed-in members through `routeAfterAuth()`. Onboarding no longer continues silently when a step fails to save (it shows an error), keeps its bottom bar above the home indicator, starts with no preselected language, and its summary shows real answers ("Not set" when skipped) without invented credits, defaults, or "verified" claims.
- Structure cleanup: dropped the `Stitch` prefix (`SplashScreen`, `WelcomeScreen`, `OnboardingScreen`); split the 2,000-line app shell into `screens/shell/` (one file per tab plus `components.tsx` and `theme.ts`) and removed dead `_quickActions`/`_JobRow`; deleted unused `catalogApi.ts`, `CatalogContentScreen.tsx`, `welcomeAssets.ts`, and the Expo template images.
- `userActivityStore` persists through the shared `persistentStorage` adapter (`frontend/src/lib/persistentStorage.ts`).
## Shell and Home (2026-10 rebuild)
- Tab routes are thin re-exports in `src/app/(tabs)/`; screens live in `modules/foundation/home/HomeScreen.tsx` and `modules/foundation/shell/tabs/{Explore,Community,Chat,Profile}Tab.tsx`. Navigation chrome is in `shell/navigation/` (`BottomTabBar`, `NavRail`, `TopNav`, `AdaptiveTabBar`, `tabs.ts`). The old `screens/shell/*` (775-line `theme.ts`, hand-drawn tab bar, fake "M" logo, unused `PostCard`) and `homeApi.ts` were deleted.
- `shell/shellApi.ts` has one `getShellContent(kind)` / `useShellContent(kind)` for `/api/v1/foundation/screens/{kind}`; Home only uses its `metrics` ("Community pulse", hidden when empty). The backend's static `items` for home are no longer rendered.
- Home = `HomeHero` (greeting with the member's first name or "Welcome back", location chip → `LocationSelectorModal`, search entry; bell/avatar only on phones) + `QuickAccess` + community pulse + module widgets from `home/registry.ts` in a `ResponsiveGrid` (1/2/2/3 columns). Each widget is exported by its module (`RoomsHomeWidget`, `RidesHomeWidget`, `CommunityHomeWidget`, `JobsHomeWidget`, `EventsHomeWidget`, `ReferralsHomeWidget`), uses `WidgetFrame`, owns its query (`[module, 'home-widget', …]`, 60s stale), and is wrapped in `WidgetBoundary`. Pull-to-refresh invalidates every `home-widget` query plus the home shell.
- Launcher: `launcher/moduleRegistry.ts` aggregates each module's `moduleMeta`; `launcher/rankModules.ts` (pure) orders tiles by device-local visits; `userActivityStore` only stores visits and exposes `useRankedModules`. Explore filters the same registry with the pure helpers in `launcher/exploreFilters.ts` (see "Explore and tab navigation").
- Profile shows only provider-confirmed badges, activity/account links, and `settings/AppearanceSettings.tsx` (theme + animation level).
- Splash is rebuilt on Tamagui with `AnimatedBrandMark` and the brand tagline (the unverifiable "Safe & Verified" badge was removed); the redirect timing is unchanged.
- Home, the shell, Profile, and Appearance use `useT()` strings (English, Telugu, Hindi). Appearance now also picks the language. Widget queries and the home/explore/community shell counts are persisted for instant start; chat/saved/profile shells are not.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
## Home v2 (2026-10, iPhone feedback)
- `HomeHeader` is a full-bleed brand strip passed to `Screen` as `hero`. It draws under the status bar/notch, keeps content at `insets.top + 8`, and shows the avatar, "Good morning, <name> 👋" (h4, one line), a city chip that opens the location sheet, and the bell on phones. Light status-bar icons apply only while Home is focused. The large gradient hero and the 3D hero on Home were removed.
- The assistant's `AssistantEntry` card overlaps the strip (`marginTop -28`, `zIndex 2`) and replaces search as the main entry. Search stays one tap away through the button beside it.
- Name rule (`home/greetingName.ts`): `user_metadata.nickname`, else the first word of `full_name`, shown only when it is 10 characters or fewer. Otherwise the greeting has no name and `NicknameNudge` offers `NicknameSheet` (2–20 characters; `authStore.updateNickname` writes auth metadata `nickname`). "Not now" sets `nicknamePromptDismissed` in `useAppearanceStore`. Profile shows a Nickname row that opens the same sheet.
- `LocationSelectorModal` is rebuilt on `shared/ui/BottomSheet`: no auto-focused keyboard, sections for current location, all US, and nearby, plus search from 3 letters. Same `useLocationStore` actions.
- `NicknameSheet` pre-fills only an existing nickname or a first name that already passes `validateNickname`. A too-long full name starts empty so the member is not handed an invalid value.
- Review follow-up (2026-10-11): `ProfileTab` renders `NicknameSheet`, so the Nickname row opens the sheet; before this fix it did nothing. `NICKNAME_MAX` equals `MAX_GREETING_NAME` (10): a saved nickname always appears in the greeting, so the nudge cannot reappear after saving. The input's `maxLength` uses the same constant. The sheet pre-fills an existing nickname as is, even one longer than the current limit, so the user can shorten it. The "Use current location" row ignores taps while a lookup is running. Layout numbers in `HomeHeader` (`ASK_CARD_OVERLAP`, shared with `HomeScreen`), `LocationSelectorModal`, `BottomTabBar`, `Screen` and `BottomSheet` are named constants.
- Onboarding notifications step (2026-10-11): choices map to notification settings keys (`chat_messages`→`chatMessages`, `emergency_sos`→`safetyAlerts`, `ride_matches`→`rideAlerts`, `room_openings`→`housingAlerts`) and are saved with `PATCH /notifications/settings`. The OS push prompt follows only when at least one alert is on. `UnreadNotificationDot` reads `/unread-count`.
- Splash and sign-out (2026-10-11): see `manabandhu-auth`. `foundation/account/signOut.ts` is the shared sign-out entry point.
- Legal and account screens (2026-10-11):
  - `foundation/legal/` (`content.ts` with `TERMS_VERSION`, `LegalScreen` with `TermsScreen`/`PrivacyScreen`) serves public routes `/terms` and `/privacy`, also the store-listing URLs. Have the text reviewed by counsel and add the operator's legal name before launch.
  - `foundation/account/AccountDataScreen` at `/settings/account` (sign-in required) handles email/phone change, data export (web download or native share sheet) and account deletion (type DELETE → re-auth → `DELETE /api/v1/me` → sign out).
  - Settings links to Account & data, Terms and Privacy, and its rows now have accessibility roles and labels.
- Onboarding profile photo (2026-10-11): uploads a real photo with `useImageUpload('avatars')`, shows progress and errors, saves `avatar_url` to the account and deletes the previously uploaded avatar. The stock Unsplash demo toggle is gone.
- Back buttons (2026-10-11): account & data and the legal pages use `shared/ui/BackButton`.
- Screen catalog (2026-10-11): added `marketplace.mine` (`/marketplace/mine`) and `marketplace.edit-listing` (`/marketplace/[listingId]/edit`); both routes require sign-in.
- Rides links (2026-10-11): `SavedScreen` lists saved rides with the shared `ListRow` (`routeLabel`, departure, price) instead of the removed `Ride.title`/`pickupArea`/`destination` aliases; `SearchScreen` shows a "Rides: <query>" suggestion row (all or Rides category, outside the result count and empty-state check) that opens `/rides/search?from=&to=` via the rides public `rideSearchHref`, and the "Austin to Dallas carpool" suggestion links there too. `screen-catalog.ts` drops the rides `request`, `seat-requests` and `participants` entries, which are now redirect-only routes.
## Explore and tab navigation (2026-10-12)
- Explore (`shell/tabs/ExploreTab.tsx`): search field with a leading icon and a clear (✕) button; category `FilterChipRow` (`radiogroup`, `Chip radio` with a match `count`, "All" first, empty categories disabled). With no query and "All" it shows "Recently used" (up to 4 in a 2/2/4/4-column grid, from `userActivityStore.recentVisits`, only when there are any) and then one `Section` per category in `exploreCategories` order. A query or category shows a flat grid with an `aria-live` count line ("3 features for “visa” in Career"). No matches → `EmptyState` with "Search rooms, rides, jobs and events" (`/search?q=<query>`) and "Clear search" (resets query and category). `danger` tone tiles use `$errorBg` + `palette.error`. Only the first paint runs the `FadeIn` entrance (`animate={false}` afterwards), so typing does not replay it.
- `launcher/exploreFilters.ts` (pure, tested by `frontend/test/exploreFilters.test.mjs`): `normalizeSearch` (case, accents, in-word punctuation, so "H-1B" = "h1b"), `matchesQuery` (every term must start a word in label, summary, category label or `keywords`), `filterModules` (label matches first, then `defaultRank`), `countByCategory`, `groupByCategory`, `recentModules`, `resultSummary`.
- Tab bars (`BottomTabBar`, `NavRail`, `TopNav`) share `useTabLabels()` (`navigation/useChatUnread.ts`): the Chat tab shows a `TabBadge` (`$primary`/`$onPrimary`, "99+" cap) with the sum of `unreadCount` from the `['chat', 'conversations']` query (signed in only, 30 s stale, refetch on focus) and is announced as "Chat, 3 unread". Nothing shows while loading, on error, or at zero. Pure helpers `totalUnread`/`badgeText` in `navigation/unreadBadge.ts` (tested by `frontend/test/unreadBadge.test.mjs`). The backend does not compute `unreadCount` yet (see `manabandhu-chat`), so the badge is currently always hidden.
- Re-pressing the active tab scrolls its screen to the top: `shared/ui/Screen` mounts `useScrollToTop` (from `expo-router`) only when it is inside the tab navigator (`BottomTabBarHeightContext` is defined), so stack screens never call it.
- `BottomTabBar`: 12pt labels, focus ring, pointer cursor and hover fill on web, selected state = tinted pill + heavier icon/label (not colour alone). On Android it unmounts while the keyboard is open. `TopNav`: the brand link, search pill and avatar are now 44pt and keyboard-focusable (the Chat count sits inline after the label there; the 18pt icon is too small for an overlay); `NavRail` items have a 44pt minimum. All tab items take Tab focus and Enter/Space on web through `shared/ui/keyboardPress`.
- Tab headers: Explore, Community, Chat and Profile use `TabHeader` with `t('tabs.*')` titles and `t('tabSubtitles.*')` subtitles (English, Telugu, Hindi); Chat's "New chat" and Community's "Post" are both `AppButton size="sm"`; the bell follows the actions on phones. Home keeps `HomeHeader`.

## P0/P1 foundation fixes (2026-10-13)
- **Sign-out** from Settings and Profile goes through `account/signOut.ts` `confirmSignOut()` (shared `confirm` sheet, then `signOutWithFeedback`, which now reports failures with shared `showError` instead of `Alert.alert`).
- **Search** (`screens/SearchScreen.tsx`) is on shared primitives: `BackButton` (fallback `/explore`), `TextField` with search icon and a 44pt clear `IconButton`, category `FilterChipRow` of radio `Chip`s with `AppIcon`s (no emoji), `ListRow` results. Each source (rooms, events, marketplace, jobs) loads and fails on its own: a failed source shows its own compact `ErrorState` with retry while the others still list results, and a still-loading source shows a skeleton line. Ranking is `search/rankSearch.ts` (pure, `frontend/test/rankSearch.test.mjs`): every query word must match; title prefix > title word > title substring > location > secondary (company) > description, ties keep order. The made-up "popular searches" were removed; the empty query shows "Jump to" links.
- **Saved** (`screens/SavedScreen.tsx`): `ScreenHeader` with back (fallback `/profile`), `SegmentedControl` tabs with real counts, per-section skeleton / `ErrorState` / `EmptyState` (each tab has its own empty copy and a browse action), rows are `ListRow` links, pull to refresh.
- **Settings** (`screens/SettingsScreen.tsx`) rebuilt on `Screen`/`Section`/`ListRow`: Account (Account & data, Notification settings — once), Maps (`SegmentedControl` radio group on iOS only; elsewhere a note that Google Maps is used), Safety, About & help (Terms, Privacy, "Redo onboarding" → `ONBOARDING_START`; the old "Replay Welcome" went to `/splash`, which bounced signed-in members home), confirmed Sign out.
- **Onboarding**: "Finish setup later" (ghost button, steps 1–7) goes Home without completing; sign-in keeps routing back until completion. The trust step has no Skip, Continue stays disabled until every configured pledge is ticked, pledge rows are `accessibilityRole="checkbox"` with checked state, and the final step will not complete until `safetyPledgeAccepted` is saved (its button becomes "Review the Trust Code").
- **Account & data**: deletion shows a visible "Deleting your account…" status and loading button; `ReauthSheet` adds "Send a new code" with a 30 s cooldown and busy state, and the code field length is `OTP_CODE_LENGTH`.
- **Home header**: the greeting's 👋 is now a sun/moon `AppIcon`; bell and avatar are 44pt, and bell, avatar and city are keyboard-reachable (`keyboardPress`) with focus rings, like `QuickAccess` tiles, `LocationSelectorModal` rows and the Profile nickname row.
- Onboarding review fix (2026-10-14): pledge state is keyed by the trust step's configured `options` (nothing hardcoded); the final step treats the pledge as missing while progress is loading or failed, and its button is disabled while loading.
- Community tab (2026-10-14): "Latest posts" shows "Showing the latest 100 posts" when the feed is full (`FEED_LIMIT` from the community module); the "Post" button opens CreatePost, which offers only joined communities (posting requires membership).
- Phase 2 visual rebuild (2026-10-14): `WelcomeScreen` slide tints/accents are palette keys (`primarySoft`/`tealBg`/`warmBg`, `primary`/`teal`/`goldText`) and styles are built per palette; each pager dot sits in a 44pt target with `aria-selected`. `OnboardingScreen` dropped its local `colors` object for `useAppearance().palette` (`makeStyles(palette)`); back, Skip and the photo badge are 44pt, language and interest chips are 44pt with checkbox/radio roles. Step logic, pledge enforcement and skip-all are unchanged.
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): the home city selector is 44pt tall (`minHeight 44`, `marginVertical -8` keeps the layout). Home "From the community" rows and the Community tab put the post age in the subtitle instead of trailing `ListRow` meta, which squeezed titles to a few letters. Onboarding's Continue chevron sits after the label (`iconAfter`).
- Account & data screen: phone changes finish in-app with a confirmation-code field (`confirmPhoneChange`); the email notice tells members to confirm from both the new and current address.
- `confirmPhone` re-checks the code format in the handler, not only through the disabled button.
- Structure cleanup (2026-10-30): imports use `@/lib/api` (the `@/lib/apiClient` shim was removed) and `@/modules/shared/ui/*` (the old `shared/components` folder and the per-module `utils/notify` re-exports were removed; use `@/modules/shared/ui/notify`). Dates, times and counts go through `@manabandhu/core` (`formatDate`, `formatTime`, `formatNumber`) instead of `toLocale*String`. The module follows the layout in `frontend/src/modules/README.md` (`utils/`, `hooks/`, `stores/`). Onboarding is split: `screens/OnboardingScreen.tsx` is the shell (header, progress, docked actions); `screens/onboarding/useOnboardingFlow.ts` holds state, persistence and navigation; `onboarding/stepMeta.ts` the step order/routes; `onboarding/styles.ts` the palette styles; `onboarding/steps/*Step.tsx` one view per step (`STEP_VIEWS[meta.index - 1]`). "Use current location" now really detects the city (`detectCurrentLocation` from `shared/utils/location/locationService`) and picks the matching metro hub, or saves the detected city; failure shows an error instead of picking a hard-coded metro. `onboardingApi.ts` is now `foundation/api.ts`, `screenDataTypes.ts` is `types.ts`, `userActivityStore` lives in `stores/`. Auth route files moved into the `src/app/(auth)` group (URLs unchanged).
