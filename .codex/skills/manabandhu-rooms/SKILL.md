---
name: manabandhu-rooms
description: Maintain ManaBandhu room discovery, search, map, filters, saved rooms, listings, creation, editing, details, privacy, inquiries, and moderation handoff. Use for any change under the rooms module or its contracts.
---

# Rooms

## Module Purpose and Ownership

Owns room discovery, search, map, filters, saved rooms, listings, listing creation/editing, details, availability, location privacy, inquiries (bookings), saved searches, reports, analytics, and moderation handoff.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/rooms` | `RoomsScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/rooms/search` | `RoomsScreen` (`screenId="search"`) | list | loading, empty, error |
| `/rooms/map` | `RoomsScreen` (`screenId="map"`) | map | loading, empty, error, permission |
| `/rooms/filters` | `RoomsScreen` (`screenId="filters"`) | filter | normal |
| `/rooms/saved` | `RoomFavoritesScreen` | list | loading, empty, error |
| `/rooms/my-listings` | `RoomMyListingsScreen` | list | loading, empty, error |
| `/rooms/create-listing` | `RoomCreateScreen` (`RoomForm`) | form | normal, error, success, loading |
| `/rooms/[roomId]` | `RoomDetailScreen` | detail | loading, error |
| `/rooms/[roomId]/edit` | `RoomEditScreen` (`RoomForm`) | form | normal, error, success, loading |
| `/rooms/[roomId]/inquiry` | `RoomInquiryScreen` | form | normal, error, success, loading |

## Component Inventory

- `RoomsScreen` - discovery frame on the shared primitives (rebuilt 2026-10-11 from a 3,872-line legacy screen): `ScreenHeader` (back, "Rooms", city `Chip`, Saved/My listings `IconButton`s, the single primary "Post a room"), `TextField` search, `FilterChipRow` quick filters (Filters (n), Pure veg, Private bath, Female only, Under $800, Furnished, Drawn area), `SegmentedControl` List | Map with counts, a results line with "Clear filters". List view is a virtualised `FlatList` (it is the scroll container, with `Screen`'s safe area/gutter/width; `numColumns` from `useAdaptiveLayout().columns` = 1/2/3/3) of `RoomCard`s; map view is a fixed, non-scrolling layout (header above, `RoomsMap` filling the remaining height, no ScrollView or pull-to-refresh) so drawing an area is never taken by scrolling. Loading `LoadingState` skeleton, `ErrorState` retry, `EmptyState` (empty city → "Show all cities" first; otherwise filters/search/sort changed → single "Clear filters"; nothing listed → "Post a room"). `/rooms/search` autofocuses search, `/rooms/map` starts on the map, `/rooms/filters` opens the filter sheet and closing it replaces with `/rooms`.
- `components/RoomCard` - photo-first card (expo-image cover or "No photo yet" placeholder, rent via `formatRent`, title, area, `Chip variant="tag"` tags from structured fields, "Verified host" `StatusBadge`); heart `SaveHeart` (44pt switch) through `useRoomSave`, hidden for the owner. Reused by favorites and the map preview.
- `components/RoomFilterSheet` - one scrollable `BottomSheet`: sort, max rent (`PRICE_STEPS` 600/800/1000/1200/1500, the quick chip uses 800), all five `ROOM_TYPES`, diet, roommate gender, private bath, catalog amenities (loading/error+retry), clear drawn area; choices apply immediately, "Clear all" and "Show n rooms".
- `components/CityPickerSheet` - offline US city search (`searchAllUSCities`), "Use my location" (`detectDeviceLocation`, message on failure), nearby cities, "All cities (USA)" with the loaded total; writes `locationStore`.
- `components/RoomsMap` - modeled on the rides map: fixed-height `$card`-radius `UniversalMapView` with approximate pins (rooms without coordinates counted, never pinned), draw-an-area search writing `filters.area`, map style radio chips (Map/Satellite/Hybrid), 3D chip (native), "Center on my location" (falls back to the city with a message), selected-room preview overlaid on the map (a `RoomCard` beside it at expanded width), "Show n rooms in this area" / "Clear area".
- `hooks/useRoomFilters` - one session-only zustand filter state shared by `/rooms`, `/rooms/search`, `/rooms/map`, `/rooms/filters`; `reset()` clears everything (search, quick chips, sheet filters, drawn area, sort); `activeCount` counts every filter except search and sort; "Clear filters" shows when any filter, the search text, or a non-default sort is set; `useFilteredRooms` memoizes city matching + filtering + sort (search via `useDeferredValue`). Pure rules live in `utils/roomFilters.ts` (`matchesRoomLocation`, `matchesRoomFilters`, `sortRooms`, `selectRooms`, `activeFilterCount`, `toggleAmenity`, `roomCoordinate`), tested by `frontend/test/roomFilters.test.mjs`.
- `RoomDetailScreen` - listing detail: pull-to-refresh, back button while loading, expo-image gallery, two columns at expanded width (gallery/summary/about | pricing/household/amenities), `StatusBadge` for owner status and verified host, tag chips. `ActionBar`: guests get primary "Contact host" (inquiry form) and secondary "Quick hello" (one-tap inquiry → chat); owners get Edit + one status action (Pause / Publish / Relist) and a "More" `BottomSheet` with the rest (Mark rented, Archive, Manage all my listings); Archive is final, so it is shown as destructive and confirmed with `useConfirm` (`ARCHIVE_CONFIRM` in `roomLabels`). Report sheet uses radio reason chips.
- `RoomEditScreen` / `RoomCreateScreen` - real forms backed by `RoomForm` (react-hook-form + zod)
- `RoomForm` - shared create/edit form with validation: `ScreenHeader`, `Screen keyboardAvoiding maxWidth="form"`, radio chip groups (room type, lease, diet, gender, bathroom), React Native `Switch` for yes/no rows (same pattern as notifications `SettingRow`), ZIP+State and Rent+Deposit side by side above compact width, sticky `ActionBar` (Save draft / Publish now, or Save changes). `ROOM_TYPES` lives in `utils/roomLabels.ts`.
- `RoomFavoritesScreen` - server favorites list as `RoomCard`s in a `ResponsiveGrid` (loading, error with retry, pull-to-refresh); `savedRoomsStore` only overlays pending saves
- `RoomMyListingsScreen` - owner listings as `OwnerItemCard`s (cover thumb, `StatusBadge` with `statusTone`: active success, paused/rejected warning, rented info), Edit + one status action inline, Mark rented / Archive / Delete in the overflow sheet (Archive and Delete are destructive and confirmed with `useConfirm`); `ResponsiveGrid` two columns at expanded width
- `RoomInquiryScreen` - inquiry form: `DateTimeField mode="date"` (min today, sent as local `YYYY-MM-DD`), radio chips for stay and diet, `EmptyState` when the listing is not accepting inquiries, back button while loading
- Shared: `UniversalMapView`, `geoPolygon` (`isPointInPolygon`), `savedRoomsStore`, `locationService` (`searchAllUSCities`), and the `shared/ui` primitives (`Screen`, `ScreenHeader`, `ActionBar`, `BottomSheet`, `Chip`, `FilterChipRow`, `SegmentedControl`, `StatusBadge`, `OwnerItemCard`, `DateTimeField`, `ResponsiveGrid`, `useConfirm`) plus `EmptyState`, `ErrorState`, `LoadingState`. The module has no colour literals, `StyleSheet` colours, or emoji (design ratchet count 0).

## API Surface

Public catalog:
- `GET /api/v1/rooms/screens/{screenId}` - catalog screen content (home/search return real listings)
- `GET /api/v1/rooms/listings` - list published listings (params: `location`, `roomType`)
- `GET /api/v1/rooms/{roomId}` (alias `/listings/{listingId}`) - listing detail (active or paused for everyone, any status for the owner/admin; **never returns exactAddress or ownerId**; coordinates rounded to 2 decimals; `isOwner`, `coverImageUrl`)

Authenticated owner:
- `POST /api/v1/rooms/listings` - create listing (owner derived from JWT)
- `GET /api/v1/rooms/{roomId}/owner` - owner detail (**includes exactAddress**)
- `PATCH /api/v1/rooms/{roomId}` - update listing (owner or admin only)
- `PATCH /api/v1/rooms/{roomId}/publish` · `/pause` · `/archive` - owner state transitions (the owner only; admins use `/admin/listings/{id}/moderate`)
- `DELETE /api/v1/rooms/{roomId}` - delete listing (owner or admin only)
- `GET /api/v1/rooms/my-listings` - owner's newest 200 listings
- `GET /api/v1/rooms/listings/{listingId}/analytics` - owner-only analytics

Images, availability, bookings, favorites:
- `GET/POST /api/v1/rooms/listings/{listingId}/images` · `DELETE /api/v1/rooms/images/{imageId}` (GET: public for active/paused listings, any status for the owner/admin; POST: max 20 photos, `rooms` bucket uploads only)
- `GET/POST /api/v1/rooms/listings/{listingId}/availability` · `DELETE /api/v1/rooms/availability/{availabilityId}` (same visibility as images; `availableTo >= availableFrom`)
- `POST /api/v1/rooms/listings/{listingId}/bookings` - booking request (no self-booking, active listings only, no duplicate pending); GraphQL `bookRoom` calls the same `RoomBookingService.create`
- `GET /api/v1/rooms/listings/{listingId}/bookings` - owner views listing booking requests (newest 200)
- `PATCH /api/v1/rooms/bookings/{bookingId}/status` - owner accepts/rejects, requester cancels; pending→accepted|rejected|cancelled, accepted→cancelled, rejected/cancelled are final (409); missing or unknown status is 400; the row is locked
- `GET /api/v1/rooms/my-bookings` - requester's inquiries
- `GET /api/v1/rooms/favorites` · `POST/DELETE /api/v1/rooms/listings/{listingId}/favorite` (also aliased at `/{listingId}/favorite`)

Saved searches, reports, moderation (all authenticated):
- `GET/POST /api/v1/rooms/saved-searches` · `PATCH/DELETE /api/v1/rooms/saved-searches/{searchId}`
- `POST /api/v1/rooms/listings/{listingId}/report` (`{reason, description}`; not your own listing; not drafts) · `GET /api/v1/rooms/my-reports`
- `GET /api/v1/rooms/admin/reports` · `POST /api/v1/rooms/admin/reports/{reportId}/review` (admin only)
- `POST /api/v1/rooms/admin/listings/{listingId}/moderate` (admin only)

Backend services: `RoomListingService`, `RoomAvailabilityService`, `RoomBookingService`, `RoomImageService`, `RoomFavoriteService`, `RoomSavedSearchService`, `RoomReportService`, `RoomAnalyticsService`.

## Data Model

- Migration `V16__extend_rooms.sql` adds `room_listing_amenities`, `room_preferences`, `room_saved_searches`, `room_reports`, `room_analytics`, `room_moderation_actions`. Existing tables: `room_listings`, `room_images`, `room_availabilities`, `room_bookings`, `room_favorites`.
- Migration `V24__enhance_rooms_and_amenities.sql`:
  - Renames legacy listing-amenity junction to `room_listing_amenities`.
  - Creates dynamic master catalog `room_amenities` (`id`, `code`, `label`, `category`, `icon_name`, `is_active`, `sort_order`) seeded with 12 diaspora housing amenities.
  - Enhances `room_listings` with diaspora & transparent pricing attributes: `dietary_preference`, `gender_preference`, `bathroom_type`, `utilities_included`, `est_utility_monthly`, `security_deposit`, `lease_term`, `is_verified_host`, `university_shuttle_accessible`, `amenity_codes`, `state_code VARCHAR(10)`, `county`.
  - Creates `room_inquiries` table with RLS (`auth.uid() = sender_id OR auth.uid() = host_id`) linking inquiries directly to chat conversations.
- Migration `V26__widen_room_listings_columns.sql`:
  - Widens `room_type` from `VARCHAR(20)` → `VARCHAR(50)` to accommodate multi-word values (e.g. `"Entire House / Sublease"`).
  - Widens `state_code` from `VARCHAR(10)` → `VARCHAR(50)` for full state names from address autocomplete.
  - Drops and recreates `room_listings_status_valid` check constraint to include `'rejected'` (used by admin moderation flow): `('draft','active','paused','archived','rejected')`.
  - **Frontend `RoomForm.tsx` Zod schema** matches: `stateCode: z.string().max(50)` (was `max(10)`).

Listing statuses: `draft`, `active`, `paused`, `archived`, `rented`, `rejected` (`rented` allowed by V39). Booking statuses: `pending`, `accepted`, `rejected`, `cancelled`. Report statuses: `open`, `in_review`, `resolved`, `dismissed`.

## Free Zero-Cost Location & Geocoding Services

- `country-state-city`: Offline US states (`getUSStates()`), cities by state (`getCitiesByState(stateCode)`), and instant search across all ~20,000 US cities (`searchAllUSCities(query)`) with zero network latency or API keys.
- OpenStreetMap Photon API (`https://photon.komoot.io/api/?q={query}&limit=5&bbox=-125,24,-66,49`): Instant address autocomplete and lat/lng coordinates for US bounds with zero billing/keys.
- Zippopotam.us (`https://api.zippopotam.us/us/{zip}`): 1-step ZIP code lookup returning city, state abbreviation, and coordinates.

## Real-Time Chat Handshake Invariant

- Contacting a host via `/rooms/[roomId]/inquiry` triggers `POST /api/v1/rooms/{roomId}/inquire`.
- Backend automatically creates a chat conversation with `type = ROOM_INQUIRY`, adds the host and sender as participants, and posts an introductory message containing a structured summary of the move-in date, stay duration, dietary preferences, and custom questions.
- Endpoint returns `{ inquiryId, conversationId }`.
- Frontend transitions seamlessly in 1 click directly to `/chat/[conversationId]`.

## Authorization and Privacy Rules

- **Exact address is never returned through public APIs.** `RoomListingResponse` omits it; only `OwnerRoomListingResponse` (owner/admin) includes it.
- Ownership is derived from the authenticated JWT (`authentication.getName()`), never from client input.
- Cross-user enforcement lives in the Spring service layer (the backend connects as the `postgres` superuser, which bypasses RLS, so RLS is defense-in-depth; service-layer checks are authoritative).
- Listing state transitions are validated server-side: draft→active/archived, active→paused/archived/rented, paused→active/archived/rented, rented→active/archived; rejected→active/draft is admin-only.
- Self-inquiry and duplicate-pending inquiries are rejected. Only the listing owner can accept/reject; only the requester can cancel.
- Reports: no self-reporting, no duplicate open reports, no reports on drafts. Review queue and review are admin-only inside `RoomReportService` (status whitelist, 400 otherwise).
- Services take `Actor` (`RoomListingService.requireOwned`/`requireVisible`); the controller never decides ownership.
- RLS is enabled on every rooms table and `anon`/`authenticated` have no grants (V39 revoked the last ones on `room_inquiries` and the `room_amenities` catalog); the frontend reads rooms only through the backend.

## State Patterns

- **Loading**: `LoadingState` while data loads
- **Empty**: `EmptyState` with action to search or create listing
- **Error**: `ErrorState` with retry action
- **Success**: navigation on create/edit/inquiry completion
- **Permission**: permission banner for map screen with fallback list

## Navigation Actions and Cross-Module Links

- Home actions: Search, Map, Saved, Create listing
- Search actions: Filters, Map, Saved
- Cross-module: deep link to `/rooms/[roomId]` from explore, saved, and search
- Chat handoff: 1-click transition from room inquiry to `/chat/[conversationId]`

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rooms/` are thin wrappers.
- `RoomsScreen` loads up to 500 active listings once (`['rooms','listings',{size:500}]`; the key does not include the city because the request does not) and matches the city and filters on the client.
- Detail, create, edit, favorites, my-listings, and inquiry screens use TanStack Query against the real REST API.
- Unified `RoomForm.tsx` consolidates creation and editing forms with react-hook-form + zod, live Photon address search, country-state-city chips, dynamic Supabase amenities catalog, and multi-image picker with thumbnail previews.
- Save/unsave uses optimistic invalidation of the detail and favorites queries.
- My Listings management supports tab filtering (`Active`, `Drafts`, `Rented`) and the `OwnerItemCard` "More" sheet (Mark rented, Archive, Delete with a destructive `useConfirm`).

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt with hitSlop for navigation icons
- Expanded width (>= 1024): 3-column room grid, map with the selected room beside it, two-column detail page
- Safe Area Insets: Top navigation and bottom action bars use `useSafeAreaInsets()` (`Math.max(insets.bottom, 16)`)
- Keyboard Avoidance: forms use `Screen keyboardAvoiding`; sheets use the shared `BottomSheet` (keyboard-aware)
- Android Hardware Back: the shared `BottomSheet` closes on back; the screen itself has no `BackHandler`.
- Virtualization: the rooms `FlatList` configures `initialNumToRender={6}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews={Platform.OS === 'android'}`
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Color contrast meets WCAG 2.1 AA (at least 4.5:1 ratio)
- Color is not the only indicator of state
- Guest `ActionBar` on room detail groups "Quick hello" and "Contact host" in one `XStack`, so on phones both wrap together under the price instead of splitting across rows.

## Current Implementation Status

- **Complete**: End-to-end vertical slice across database (V16 & V24), backend (controllers/services/repositories/DTOs/authorization/chat handshake), REST contracts (openapi.yaml), and frontend (list, detail, create, edit, favorites, my-listings, inquiry).
- **Zero Hardcoding**: All dynamic amenities, lifestyles, preferences, and locations fetched from Supabase / REST backend.
- **Free Geocoding**: Integrated `country-state-city`, OpenStreetMap Photon autocomplete, and Zippopotam.us ZIP auto-fill.
- **Chat Handshake & Integration**: Direct 1-click transition from room inquiry into `/chat/[conversationId]`, with conversations categorized into "Rooms" in chat inboxes with room badges.
- **Owner Listing Management**: "My listings" icon in the `RoomsScreen` header opens `/rooms/my-listings`; each card offers Pause/Publish/Relist inline (`publishRoomListing`, `pauseRoomListing`).
- **Image Carousel**: Rich swipeable carousel in `RoomDetailScreen` with slide counter (`1 / 5`), category tag, active indicator dots, left/right chevrons, and interactive thumbnail gallery strip.
- **Cultural Badges**: Pure veg, Private bath and Furnished tags (`Chip variant="tag"`, from structured fields only) on room cards; full facts on the detail view.
- **1-Click Landlord Chat**: "Quick hello" on `RoomDetailScreen` triggers the `inquireRoom` handshake and opens `/chat/[conversationId]`; the primary "Contact host" opens the full inquiry form.
- **Code Consolidation**: Unified `RoomForm.tsx` eliminates duplication across create and edit screens.
- **Global Location Synchronization & Multi-Metro Discovery**: Integrated with `useLocationStore` (`frontend/src/lib/locationStore.ts`) and universal dynamic `matchesRoomLocation` (replacing hardcoded metro keyword arrays with coordinate proximity ~45mi / 0.65°, token matching, preset landmarks, and state filtering), ensuring active city selection dynamically filters room listings, map markers, and city active counts across all US cities with zero hardcoding.
- **Location Matching Accuracy & Keyboard-Safe City Bottom Sheet**: Fixed false-positive matches where selecting specific cities (such as Frisco, TX) erroneously matched distant metro rooms (such as Austin, TX); removed 2-letter state codes from preset landmarks, enforced exact city token prioritization, and restricted specific-city coordinate radius to ~12mi (0.18°) while preserving ~45mi (0.65°) for multi-city metro presets; replaced all-cities fallback on zero-match with intuitive city empty state; wrapped city selection modal in `KeyboardAvoidingView` with stabilized minimum sheet height (460px), absoluteFill dismiss backdrop, and `keyboardShouldPersistTaps="handled"` on scroll view so sheet never collapses below the software keyboard when search results are filtered.
- Security & correctness hardening (2026-10): `GET /api/v1/rooms/listings` now applies `lat`/`lng`/`radiusMiles` (bounding box) and `roomType` together with all other filters in one query (`RoomSearchCriteria`); page size is capped at 500. GraphQL `roomListing` hides drafts from non-owners and returns `exactAddress` only to the owner or an admin. Inquiries require an active listing. RoomsController no longer has its own exception handler; `ApiExceptionHandler` maps errors without leaking messages.
- Screen metrics are computed from the database (2026-10): `RoomsContentService.screen(id, Optional<Actor>)` uses `countByStatus("active")`, the caller's `countSavedListingsByUserId` and `countByOwnerId`, and a paged query for featured listings (no whole-table loads); map, filters and create-listing screens show no metrics; anonymous viewers get no saved/own counts.
- Cleanup: removed unused `usLocationData.ts`, API/type exports, and repository methods; dropped the unused `RoomModerationAction` entity.
- Offline US states and cities now come from `utils/usLocationData.ts` (compact strings generated from the countries-states-cities database, ODbL) instead of the `country-state-city` package. That package bundled an 8 MB worldwide `city.json` that crashed route loading on iOS/Hermes (`WeakMap key must be an Object` on every screen importing `locationService`), doubled the iOS bundle (17.4 MB → 9.3 MB without it), and is GPL-3.0. `test/locationService.test.mjs` covers states, per-state cities, search, and nearby ordering.
- `savedRoomsStore` persists through the shared `persistentStorage` adapter (`frontend/src/lib/persistentStorage.ts`).
- Public API: `rooms/index.ts` exports `moduleMeta` and `RoomsHomeWidget` (four newest listings in the member's chosen city via `listRoomListings({ size: 4, city, state })`, or nationwide).
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- `screens/RoomListScreens.tsx` was split into `RoomFavoritesScreen.tsx` and `RoomMyListingsScreen.tsx` (shared `roomListStyles.ts`); `RoomForm` moved to `components/RoomForm.tsx` because it is not a screen.
- P0 fixes (2026-10-10): `isVerifiedHost` is server-only. It was removed from `CreateRoomListingInput` and `UpdateRoomListingInput`, so a client-sent value is ignored, and listings start unverified (setting it is an admin/back-office task; no endpoint exists yet). GraphQL `savedRoomListings` requires a login and returns the caller's favorites (`RoomFavoriteService.findSavedListings`), the same as REST `/favorites`; it used to return every listing whose status was "saved". GraphQL `createRoomListing` goes through `RoomListingService.create`, the same validated draft path as REST. The unvalidated `RoomsService.create`/`findSaved` helpers were deleted. GraphQL `roomListings` is capped at the newest 100 active listings.
- Images (2026-10-11): `POST /rooms/listings/{id}/images` accepts only `…/storage/v1/object/public/rooms/<ownerId>/<uuid>.<ext>` URLs from `/api/v1/media/upload-url` (400 otherwise).
- Production pass (2026-10-11):
  - Public responses (`RoomListingViews`) drop `ownerId`, round coordinates to 2 decimals (~1 km), and add `isOwner` and `coverImageUrl`; amenities, preferences, saved flags and covers are batch-loaded (no per-listing queries). GraphQL `RoomListing` does the same through `@SchemaMapping` (`ownerId` nullable, `isOwner`, rounded `latitude`/`longitude`, nullable `broadLocation`).
  - Create/update validate prices (`@NotNull` on create, `@Digits(8,2)`), deposits/utilities (≥ 0), and the allow-lists in `RoomInputRules` (diet, gender, bathroom, lease); `amenities` (≤ 30, each ≤ 80) replaces the listing's amenity set.
  - Inquiries need an `active` listing; a repeat inquiry from the same guest posts into the existing chat instead of opening and notifying a new one; `moveInDate` must not be in the past and `stayDurationMonths` is null (flexible) or 1–36.
  - `RoomsService` (unchecked update/delete/book helpers) was deleted; lists are capped (my-listings, favorites, bookings, reports: 200; saved searches: 100); the listing search ignores client sort parameters.
  - V39 revokes Data API access on `room_inquiries`/`room_amenities`, allows `rented`, drops the no-op `room_reports_not_self` check and widens `room_saved_searches.room_type` to 50.
  - Frontend: lowercase statuses compared case-insensitively (My Listings tabs Active/Drafts/Rented, publish/pause toggle, Mark rented/Relist); `RoomForm` uploads up to 10 photos with `useImageUpload('rooms')`, sends amenity codes, and offers "Publish now" (primary) or "Save draft"; the detail screen shows only real photos, amenities and deposit (no stock images or invented claims), owner actions for `isOwner`, a Report sheet, and 404 vs retryable errors; `hooks/useRoomSave` does optimistic save with rollback; `savedRoomsStore` (`manabandhu-saved-rooms-v2`) holds per-user overrides only and is cleared on sign-out; filters use real fields (no "verified only"); the map skips rooms without coordinates; `utils/notify` shows errors on web too.
  - Radius search compares the rounded (2-decimal) coordinates and uses at least a 1-mile box, so shrinking the box cannot locate a listing more precisely than the public pin. `privateBathOnly` matches both `PRIVATE_*` bathroom types.
  - The move-in date is checked in `RoomInquiryService` against UTC-12 (the guest sends their local date), not with `@FutureOrPresent` on the server's zone.
  - Editing sends `""` to clear optional text (stored as null) and `0` to clear deposit/utility; `null` means unchanged.
  - Known gap: photo URLs (`coverImageUrl`, `/images`) contain the uploader's user id because storage keys are `rooms/<userId>/<uuid>`; hiding it needs an opaque storage prefix (tracked as follow-up).
  - Tests: `RoomsProductionRulesTest`, `frontend/test/roomLabels.test.mjs`, `RoomListingGraphqlControllerTest`, `RoomAvailabilityServiceTest`; smoke: `== rooms production rules` in `authz-smoke.mjs`.
  - Shared primitives (2026-10-11): `RoomDetailScreen` uses the shared `ActionBar` (reserving `ACTION_BAR_SPACE`) instead of a hand-rolled bar; `utils/notify.ts` re-exports `shared/ui/notify` (confirmations show the in-app `ConfirmSheet`), and deleting a listing passes `{ destructive: true }`.
- Design-system rebuild (2026-10-11): rooms screens moved to the shared Tamagui primitives (see Component Inventory). Removed from the legacy discovery screen: the local `colors` object and `StyleSheet`, emoji icon helpers, three custom `Modal`s (city, sort, filters; sort merged into the filter sheet), the `BackHandler` block, the `PanResponder` draggable map preview/badge, the floating "Post a room" button (one primary action in the header), the dense "List" vs "Card" duplicate views (one photo-first card grid), and the dual-pane list+map (List | Map toggle; map shows the selected room beside it when wide). Fixes: all five room types are filterable; the gender quick chip and sheet share one state; one reset clears search, quick chips, sheet filters and drawn area; the filter count covers every filter; the listings query key no longer changes with the city; detail copy no longer promises a map. City matching compares state codes only when both sides are two-letter codes (some rows store full state names). Tests: `frontend/test/roomFilters.test.mjs`.
- Paged responses (2026-10-12): `GET /api/v1/rooms/listings` returns a `PagedModel` (`{ content, page }`); `listRoomListings` reads it through `toPage` from `@/lib/springPage`.
- City matching (2026-10-12): rooms with coordinates match a city within 14 great-circle miles (`distanceMiles` in `shared/utils/geoPolygon.ts`), replacing a 0.2° box that shrank east–west with latitude.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['housing', 'roommate', 'sublease', 'sublet', 'rent', 'apartment', 'lease', 'accommodation']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
