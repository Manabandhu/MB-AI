---
name: manabandhu-rides
description: Maintain ManaBandhu ride discovery, offers, requests, seats, participants, history, ratings, maps, safety, and ride management. Use for any change under the rides module or its contracts.
---

# Rides

## Module Purpose and Ownership

Owns ride discovery, offers, requests, seats, participants, history, ratings, location sharing, safety state, and ride management.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/rides` | `RidesScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/rides/search` | `RidesScreen` (`screenId="search"`, `?from=&to=`) | list | loading, empty, error |
| `/rides/map` | `RidesScreen` (`screenId="map"`) | map | loading, empty, error, permission |
| `/rides/filters` | `RidesScreen` (`screenId="filters"`, When/Sort sheet open) | filter | normal |
| `/rides/offer` | `RideOfferScreen` | form | normal, error, success, loading |
| `/rides/request` | redirect to `/rides/search` (keeps `from`/`to`) | redirect | — |
| `/rides/saved` | `RideSavedScreen` | list | loading, empty, error |
| `/rides/mine` | `RideMyListingsScreen` (`?tab=riding`; old `?tab=trips` still works) | list | loading, empty, error |
| `/rides/history` | `RideHistoryScreen` | list | loading, empty, error |
| `/rides/[rideId]` | `RideDetailScreen` | detail | loading, not found, error |
| `/rides/[rideId]/manage` | `RideManageScreen` (`?tab=requests|riders`) | hub | loading, not found, error, saving |
| `/rides/[rideId]/seat-requests` | redirect to `/rides/[rideId]/manage?tab=requests` | redirect | — |
| `/rides/[rideId]/participants` | redirect to `/rides/[rideId]/manage?tab=riders` | redirect | — |
| `/rides/[rideId]/rate` | `RideRateScreen` | form | normal, success |

## Component Inventory

- `RidesScreen` - search/map/filters: `ScreenHeader` (back; My rides, Saved, History icon actions; one primary "Offer a ride"), From/To `RideLocationPicker` with swap, one `FilterChipRow` (When ▾, Women only, No tolls, Recurring, Luggage, Sort ▾, Clear all; ▾ opens the When/Sort sheet), `SegmentedControl` List (list icon, real count) | Map on single pane, list and map side by side on dual pane, paged results with "Load more"
- `RideDetailScreen` - `ScreenHeader` (heart save, share), price panel, seat panel (Book a seat with `NumberStepper` / Your booking / Your seat request / You drive / blocked reason), route facts, women-only note, "On this ride" (`PersonRow`, members), safety copy linking to `/safety`, sticky `ActionBar` (price + seats; Book N seats / Manage ride / Open chat / Rate driver); two columns at expanded width
- `RideManageScreen` - driver hub with `SegmentedControl` Overview | Requests (n pending) | Riders; header Chat/View/Share; Overview: status actions, `NumberStepper` total seats (only `seatsTotal` is sent; the server derives open seats), price, Repeat trip, Danger zone (Cancel / Delete explained); Requests: `PersonRow` Accept/Decline; Riders: bookings (`PersonRow`, cancel; cancelled collapsed) and participants
- `RideOfferScreen` - `RideFormScreen` (form width, keyboard avoiding, scroll to the first error), earlier-route template chips with feedback, Route, When, Seats and price (`NumberStepper`), Preferences (tolls, luggage, who can book), sticky Publish `ActionBar`; success view with Manage ride / View ride / My rides
- `RideMyListingsScreen` - Driving (n) / Riding (n), upcoming only, `OwnerItemCard` (one inline action, rest in overflow), cancelled bookings collapsed, History in the header
- `RideHistoryScreen` - `OwnerItemCard`; Rate leads on completed rides; drivers repeat
- `RideSavedScreen` - pressable `RideCard`s whose heart removes the bookmark
- `RideRateScreen` - shared `RatingInput`, `Screen keyboardAvoiding maxWidth="form"`
- Local components: `RideCard` (merged list card: price, route, departure, seats, `StatusBadge`, record facts as tag `Chip`s, heart), `InlineNotice` + `hooks/useTimedNotice` (success notice beside the action, auto-clears after 6 s), `hooks/useSavedRides` (bookmarks + heart toggle), `RideFormScreen`/`useFormScroll` (the shared `Screen` exposes no scroll ref), `DeparturePicker`, `RepeatTripSheet`, `RideLocationPicker`

## API Surface

- `GET /api/v1/rides/screens/{screenId}` - catalog screen content
- `GET /api/v1/rides/offers` - list active ride offers (params: `origin`, `destination`)
- `POST /api/v1/rides/offers` - create ride offer (authenticated)
- `GET /api/v1/rides/offers/{offerId}` - get ride offer by ID
- `PATCH /api/v1/rides/offers/{offerId}` - update ride offer
- `DELETE /api/v1/rides/offers/{offerId}` - delete ride offer
- `GET /api/v1/rides/my-offers` - list driver's ride offers (authenticated)
- `PATCH /api/v1/rides/offers/{offerId}/seats` - adjust available seats (param: `seats`)
- `GET /api/v1/rides/offers/{offerId}/requests` - list ride requests for an offer
- `POST /api/v1/rides/offers/{offerId}/requests` - create ride request (authenticated)
- `GET /api/v1/rides/requests/{requestId}` - get ride request by ID
- `PATCH /api/v1/rides/requests/{requestId}/status` - update request status
- `DELETE /api/v1/rides/requests/{requestId}` - delete ride request
- `GET /api/v1/rides/my-requests` - list rider's requests (authenticated)
- `GET /api/v1/rides/offers/{offerId}/participants` - list ride participants
- `POST /api/v1/rides/offers/{offerId}/participants` - add participant (authenticated, `role` param)
- `DELETE /api/v1/rides/participants/{participantId}` - remove participant
- `GET /api/v1/rides/offers/{offerId}/bookings` - list ride bookings
- `POST /api/v1/rides/offers/{offerId}/bookings` - create ride booking (authenticated)
- `GET /api/v1/rides/bookings/{bookingId}` - get ride booking by ID
- `PATCH /api/v1/rides/bookings/{bookingId}/status` - update booking status
- `DELETE /api/v1/rides/bookings/{bookingId}` - cancel booking
- `GET /api/v1/rides/my-bookings` - list rider's bookings (authenticated)
- `GET /api/v1/rides/offers/{offerId}/ratings` - list ratings for an offer
- `POST /api/v1/rides/offers/{offerId}/ratings` - create rating (authenticated)
- `GET /api/v1/rides/ratings/{ratingId}` - get rating by ID
- `DELETE /api/v1/rides/ratings/{ratingId}` - delete rating
- `GET /api/v1/rides/my-ratings` - list ratings received (authenticated)

Backend services: `RideOfferService`, `RideRequestService`, `RideParticipantService`, `RideBookingService`, `RideRatingService`.

## Demo Fixtures

- Frontend fallbacks removed in favor of backend API endpoints and loading/empty/error states.

## State Patterns

- **Loading**: `LoadingState` while screen content loads
- **Empty**: `EmptyState` with action to search or offer ride
- **Error**: `ErrorState` with retry action
- **Success**: navigation on offer/request/rate completion
- **Offline**: offline banner with cached data fallback
- **Permission**: permission banner for map screen with fallback list

## Navigation Actions and Cross-Module Links

- Rides header: My rides, Saved, History, Offer a ride (primary)
- Detail: Book seat (riders), Manage ride (driver), Open chat and Rate (members), Safety Center
- Manage: tabs Overview / Requests / Riders; Chat, View, Share; Repeat trip
- My rides: History in the header; cards open Manage (driving) or the ride (riding)
- Cross-module: Home widget (next trip first), global Search (`/rides/search?from=&to=`), Saved (`ListRow`), notifications (`/rides/{id}`, `/rides/{id}/seat-requests` → Manage Requests)

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rides/` are thin wrappers
- `RidesScreen` uses `useInfiniteQuery` over `listRideOffersPage` (50 per page)
- `FeatureScreen` provides adaptive catalog/list layout
- In `RideOfferRepository`, `searchActive` JPQL query uses explicit `cast(:param as String)` for nullable text parameters (`:origin`, `:destination`, `:genderPreference`) to prevent PostgreSQL type inference as bytea when evaluating `LOWER()`

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Bottom sheets and modals respect safe area insets
- Color is not the only indicator of state
- Ride detail: the driver sees no save heart on their own ride; the route card prints distance once (`rideTags(ride, { distance: false })`). Manage → Requests shows the rider's note full-width under the row (`PersonRow detail`) instead of a clipped subtitle. The offer `ActionBar` caption may wrap to two lines.

## Current Implementation Status

- **Partial**: Backend REST API complete with full CRUD for offers, requests, participants, bookings, and ratings, including automatic seat management on booking create/cancel. Frontend screens (home, search, filters, saved, mine, history, seat-requests, participants, detail, manage, offer, request, rate) remain catalog/placeholder pending integration with backend REST APIs.
- Offer lifecycle statuses are standardized to `draft`, `active`, `completed`, `cancelled`. Request statuses use `pending`, `accepted`, `rejected`, `withdrawn`. Booking statuses use `pending`, `confirmed`, `cancelled`. Rating validation prevents self-rating.
- RLS policies are defined in `V16__add_rides_rls_policies.sql` for all five ride tables.
- Admin rides read endpoint exists at `GET /api/v1/admin/rides`.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent backend changes: added aliased routes to `RidesController` (`/{rideId}`, `/{rideId}/owner`, `/{rideId}` PATCH/DELETE, `/mine`, `/history`, `/saved`) alongside existing `/offers/{offerId}` paths to match frontend API calls.

- Recent fixes: added `destination` and `departureAt` to `CreateRideRequestInput` so `RideRequestScreen` payload typechecks; fixed `RideRateScreen` mutation to pass the rating object directly to `submitRideRating` (was passing `(rideId, input)` which mismatched `MutationFunction`); added `Input`/`InputField` imports to `RideRateScreen`; added `isReported()` getter to `RideOffer` so `AdminRidesController` compiles; updated `CommunityPostServiceTest` to pass `communityId` to the new `CreatePostInput(UUID, String, String)` constructor; added `setReported(boolean)` mutator to `RideOffer` so admin moderation can flip the reported flag; changed `CreateRideRatingInput` import in `RideRateScreen` to `import type` and reordered imports per Biome.

- Stitch rides implementation: Overhauled `RidesScreen` and `RideDetailScreen` using Stitch MCP generated designs (Project ID `9663298292574415459`). Replaced placeholders with responsive Expo React Native carpool UI featuring interactive route search, origin/destination swap, segmented Available Rides list vs Live Route Map view, horizontal quick filter chips, responsive bottom-up mobile modal / centered desktop modal for sorting and filter options, live Supabase queries via `listRideOffers()`, visual route timeline, interactive seat picker, community fuel split breakdown, and direct seat booking with `bookRideSeat()`. Unblocked public discovery routes (`/rides`, `/rides/search`, `/rides/map`, `/rides/filters`, `/rides/[rideId]`).
- Fallback cleanup: deleted `ridesFallbacks.ts` in favor of live Supabase and Spring REST carpool queries, error states, and responsive empty states.
- Hardcoded data cleanup: removed `DRIVER_METADATA` and `RIDE_DETAILS_DATA` dictionaries containing fake personas ("Vikram Patel", "Sneha Murthy", etc.) in `RidesScreen` and `RideDetailScreen`, and made seat slot 2 dynamically available or marked as verified passenger reservation based on `seatsAvailable`.
- Ride offer screen overhaul & backend integration: Rebuilt `RideOfferScreen.tsx` with interactive origin/destination planner, route swap, milestone transit calculation, departure date/time picker, flexible departure toggle, vehicle specs input, seat counter, fuel contribution calculator, commute vibe chips, women-only carpool toggle, driver pledge card, and `createRideOffer` mutation directly posting to `POST /api/v1/rides/offers`.
- V25 Overhaul: Enhanced `ride_offers` and `ride_requests` with spatial coordinates (`origin_lat/lng`, `destination_lat/lng`), route polyline, distance/duration, toll preference (`AVOID_TOLLS`, `TOLLS_INCLUDED`, `TOLLS_SPLIT`), commute recurrence (`is_recurring`, `recurrence_pattern`, `recurring_days`), luggage capacity, and gender preferences.
- Google Maps & Toll Routing: Integrated Google Directions API (`avoid=tolls` flag, toll route warnings check) and Google Places Autocomplete with fallback to OpenStreetMap Photon and haversine calculations when `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is omitted.
- 1-Click Fast Creation & Re-activation: Added top template ribbon in `RideOfferScreen`, 1-click trip clone/re-activate endpoint `POST /api/v1/rides/offers/{offerId}/re-activate`, and re-activate buttons on `RideMyListingsScreen` and `RideHistoryScreen`.
- Automated 2-Hour Ephemeral Chat: Ephemeral group chat provisioned via `POST /api/v1/rides/offers/{offerId}/chat` with type `RIDE_TEMP`. When driver marks trip `COMPLETED` via `PATCH /api/v1/rides/offers/{offerId}/status`, `chat_expires_at = completed_at + INTERVAL '2 hours'`. Background scheduled job executes `public.purge_expired_ride_chats()` to permanently delete expired conversations, participants, and chat messages.
- Multi-Device UX & Responsive Audit: Updated all rides screens (`RideOfferScreen`, `RideDetailScreen`, `RideManageScreen`, `RideHistoryScreen`, `RideMyListingsScreen`, `RidesScreen`). Integrated `KeyboardAvoidingView` (`behavior: Platform.OS === 'ios' ? 'padding' : 'height'`) with `keyboardShouldPersistTaps="handled"` on forms, `BackHandler` for Android hardware back button handling, safe area insets on headers and sticky action bars (`Math.max(insets.bottom, 16)`), 44x44pt touch targets with `hitSlop`, and structured multi-column commute comparison table on desktop viewports.
- Repo-Wide Code Review & Cache Invalidation: Added `['rides', 'saved']` cache invalidation upon seat booking in `RideDetailScreen.tsx` to refresh saved rides seat counts; added defensive parameter guard `if (!rideId)` on `RideDetailScreen`; extracted reusable `RideLocationPicker` component; cleaned unused variables and constants (`_RECURRENCE_PATTERNS`, `_user`, `_vehicle`).
- Owner Management & Actions Remediation: Added top bar "My Rides" button in `RidesScreen` navigating to `/rides/mine`. Added 1-tap **[🟢 Active / ⏸️ Deactivate]** toggle switch on each offer card in `RideMyListingsScreen` and driver control toggle in `RideManageScreen` backed by `updateRideStatus`. Interactive "When" and "Commute Mode" filter pills in `RidesScreen`. Ride card chat button invokes `provisionRideChat` and seamlessly navigates to `/chat/${conversationId}`. In `RideDetailScreen`, wired Share button to native `Share.share`, wired Bookmark button to `saveRide`/`unsaveRide` backend mutation, and capped seat selection count to `rawOffer.seatsAvailable`.
- Ephemeral Coordination Chat Banner: In `ConversationScreen.tsx`, temporary ride coordination chats (`RIDE_TEMP` or ride context) prominently display an alert banner: `"🔒 Temporary Chat: This conversation will self-delete 2 hours after trip arrival."` ensuring riders and drivers know coordination chats are time-bounded.
- Global Location Store Sync: Integrated `RidesScreen.tsx` with `useLocationStore` (`frontend/src/lib/locationStore.ts`), ensuring selected metro area and carpool corridors reactively reflect the global app location chosen on the Home screen.
- Security & correctness hardening (2026-10): Authorization lives in services via `RideAccess` (driver / passenger / admin). Booking statuses are `pending|confirmed|cancelled`; cancel is terminal and returns seats, delete returns seats, re-confirming a cancelled booking is rejected (closes a seat-inflation exploit), and seat changes lock the offer row (`findByIdForUpdate`). Requests, bookings and participants are visible only to the driver/admin (others see their own rows); participant role is derived server-side; ride chat provisioning requires ride membership; ratings require both people to have shared the ride, once per pair. Offer statuses are stored lowercase (`draft|active|in_progress|completed|cancelled`, V31); the frontend compares case-insensitively. Added bookmarks (`ride_favorites`, `POST/DELETE /api/v1/rides/{rideId}/favorite`) and the `/api/v1/rides/maps/{route,autocomplete,geocode}` Google proxy (`GOOGLE_MAPS_SERVER_KEY`). The frontend `api.ts` maps backend request/participant/rating shapes; "Request a ride" now searches matching offers (`/rides/search?from=&to=`).
- Screen metrics are computed from the database (2026-10): `RidesContentService` counts upcoming active offers (`countOpen`, `sumOpenSeats`, distinct pickup areas/destinations) and lists the next 3 open offers as home items instead of invented rides; search/filters/offer form facts were removed.
- Ride details show only ride-record facts (2026-10): date, recurrence, distance, duration, seats, luggage, rider preference and tolls. Removed invented driver ratings, carpool counts, on-time rates, "verified driver"/employer/vehicle claims, amenities, the guarantee banner, the WhatsApp notification claim and the $6 default price; safety copy is advice, not verification claims.
- Maps proxy (2026-10): `RideMapsController` binds caller input only to RestTemplate URI variables with `EncodingMode.VALUES_ONLY`, so input can never change the Google host, path, or other parameters (CodeQL SSRF); coordinates are range-checked.
- Cleanup: removed unused API/type exports and repository/GraphQL helpers.
- Public API: `rides/index.ts` exports `moduleMeta` and `RidesHomeWidget` (next three future offers with open seats).
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 booking safety (2026-10-10): `FEMALE_ONLY` / `MALE_ONLY` rides are enforced on booking and on seat requests through `RideAccess.requireEligibleRider` (403). Eligibility reads `Actor.verifiedGender`, taken from the JWT's `app_metadata.gender` (writable only with the service role); self-declared `user_metadata` never counts. No in-app verification flow sets it yet, so restricted rides accept only riders an admin has verified. Seat-request transitions are explicit: `pending → accepted|rejected` (driver), `pending → withdrawn` (rider), `accepted → rejected|withdrawn`; rejected/withdrawn are terminal (409). Accepting locks the request then the offer (`findByIdForUpdate`), requires an active, not-departed ride with enough seats and no live booking by that rider, decrements seats and adds a `rider` participant; leaving `accepted` returns the seats and removes the participant unless a live booking remains. A rider with an accepted request cannot also book. `RideDetailScreen` and `RideSeatRequestsScreen` show the server's reason when booking or accepting fails.
- Review fixes (2026-10-11): deleting a seat request is allowed only while it is not accepted (409, withdraw instead), so seats and participant access cannot leak; a rider with an accepted request cannot request again or be accepted twice on the same ride. Seat-request notifications open `/rides/{id}/seat-requests`.
- Production pass (2026-10-11), backend:
  - **Visibility.** Every ride endpoint returns `RideOfferView`: `driverId`, `conversationId` and `routePolyline` only for members (driver, passengers, admins), coordinates rounded to 2 decimals for everyone else, plus `isDriver`/`isMember`. Public ratings (`RideRatingView`) carry no rater/ratee ids; GraphQL masks `RideOffer.driverId` (nullable, adds `isDriver`) and `RideRating.raterId/rateeId` the same way.
  - **Editing.** `UpdateRideOfferInput` no longer accepts `status`, `conversationId`, `completedAt` or `chatExpiresAt` (that allowed taking over or wiping another ride's chat). `RideOfferService.update/updateStatus/adjustSeats/delete/reactivate` take `Actor`, check the driver in the service, and lock the offer row. Seat totals can't drop below seats riders hold (409); open seats never exceed `total − held` (`RideMembership.heldSeats`).
  - **Status.** draft→active|cancelled, active→in_progress|completed|cancelled, in_progress→completed|cancelled; finished rides are final and cannot be edited. Cancel or delete runs `RideMembership.releaseEveryone`: bookings cancelled, open/accepted requests rejected, riders removed from participants and the ride chat, and each rider notified.
  - **Bookings and requests.** Bookings lock the booking row before cancel/delete (no double seat return), add the rider as a participant, and drop chat access on cancel; requests leaving `accepted` drop chat access too. Requests on departed rides are 409; V40 adds a unique pending request per rider and ride. Deleting a participant who still holds seats is 409 (cancel or withdraw instead); joining is idempotent.
  - **Validation.** `RideInputRules`: 1–8 seats, coordinate ranges, polyline ≤ 20k, toll/recurrence/luggage/gender/day allow-lists; re-activate needs a future `newDepartureAt`.
  - **Ratings, history, lists.** Ratings only after `completed`; `rateeId` optional (defaults to the driver). `/history` lists completed, cancelled or departed rides the user drove or rode on. Lists are capped (200); searches ignore client sort; the maps proxy allows 60 calls per user per minute (429).
  - **Removed and tested.** `RidesService` was removed. V39 revoked the Data API grants and write policies on all ride tables. Tests: `RideOfferServiceTest` (rewritten), booking/request tests updated; smoke: `== rides production rules`.
- Production pass (2026-10-11), frontend:
  - **Data mapping.** `api.ts` `toRide` is the only place the backend shape is mapped (`routeLabel`, `contributionLabel` "$12 / seat" or "Free", lowercase statuses via `statusIs`). Search is debounced 300 ms, server-side filtered, 50 per page. The `title`/`pickupArea`/`destination` aliases on `Ride` remain only for foundation's `SavedScreen`, to be dropped once it uses `routeLabel`.
  - **Removed invented data.** The activate/deactivate toggle is gone. Manage uses `PATCH /status` (start, complete, cancel), each change confirmed. Invented content is removed (saved badge, verified-passenger seat, 5-day pass, toll fee, seat fallbacks, all-CONFIRMED participants, straight-line route estimates); a failed route lookup leaves distance and time empty, and a maps 429 shows a friendly message.
  - **Ride detail.** "Book seat" confirms, then reports honestly. It is hidden with a reason for the driver and for full, finished or departed rides. Seat icons are real, women-only rides explain verification, chat and participants are shown to members only, and errors distinguish 404 from retryable failures.
  - **My rides.** `/rides/mine` has "Driving" and "My trips" (`?tab=trips`, `GET /my-bookings`, cancel with confirmation) tabs. Manage lists bookings for the driver; driver actions are hidden from riders, who can withdraw their own request.
  - **Shared components.** New `ChoiceChip` (44 pt, radio or pressed state), `DeparturePicker` (30 date chips plus a time stepper; no native date picker dependency), `RideListCard`, `RepeatTripSheet` (sends `newDepartureAt`), and `utils/rideFormat` and `utils/notify`.
  - **Rating.** A single 1–5 score, opened only for completed rides; passengers rate the driver by omitting `rateeId`.
  - **States and accessibility.** Every list has pull-to-refresh, loading, empty and error-with-retry states. Every control has a role, label and state; colors use theme tokens only (rides has no color literals left).
  - **Tests.** `frontend/test/rideFormat.test.mjs`.
- Shared primitives (2026-10-11): `ChoiceChip` was removed; rides uses the shared `Chip` (44 pt when pressable, `radio` for one-of-many). `DeparturePicker` is now a thin wrapper over the shared `DateTimeField` (`datetime` mode, today through 30 days ahead) and keeps its `DepartureValue` API and `formatTime`/`departureSummary` exports. `RideRateScreen` uses the shared `RatingInput`. `utils/notify.ts` re-exports `shared/ui/notify` (confirmations show the in-app `ConfirmSheet`); cancel, delete, withdraw and declining an accepted rider pass `{ destructive: true }`.
- Rides UX pass (2026-10-11), frontend only (backend unchanged):
  - **P0 fixes.** `bookingBlockReason` treats members (live booking or accepted request) as already seated; the ride page shows "Your booking" (Open chat, Cancel booking with a destructive confirm) or "Your seat request" (Withdraw) from the rider's own `GET /offers/{id}/bookings` and `/requests` rows via `viewerSeat`, instead of "Book a seat". The "Find a ride" button is gone and `/rides/request` redirects to `/rides/search`. Copy no longer promises riders a request flow (riders book instantly; drivers see any requests in Manage). Search pages through `GET /offers` (`listRideOffersPage`: `page`, `size=50`, total from `totalElements` or `page.totalElements`) with "Load more" and a "Showing the first N of M" notice; When and Luggage are not server parameters, so the notice says they only check loaded rides. Success notices render beside their action and clear after 6 s. Book, cancel, withdraw, accept/decline, status changes and repeat invalidate the whole `['rides']` prefix. Confirms use `useConfirm`; only cancel, delete, withdraw and declining an accepted rider are destructive.
  - **Routes.** `/rides/[rideId]/seat-requests` and `/participants` redirect to `manage?tab=requests|riders`; Manage sends non-drivers (403) to the ride page, where a rider's own request or booking is shown. `RideSeatRequestsScreen`, `RideParticipantsScreen`, `RideRequestScreen` and `RideListCard` were removed.
  - **Data.** `Ride.title`/`pickupArea`/`destination` aliases and `RideListing` were removed (foundation Saved uses `routeLabel`). New pure helpers in `utils/rideFormat.ts`: `viewerSeat`, `departsInWindow`, `hasLuggageSpace`, `heldSeats`, `statusTone`, `isForbidden`, `rideSearchHref` (exported from `rides/index.ts` for global search). Tests: `frontend/test/rideBooking.test.mjs`.
  - **Home widget.** Signed-in users see their next trip first (soonest upcoming ride they drive, or one of up to 3 booked rides; never persisted), then public offers (`size=10`) with the price as row meta, teal tone.
  - **Review fixes.** `GET /saved` also returns rides the viewer rides on, with no bookmark flag, and unsaving those is a no-op: `isJoinedRide` (member, not driver) rides show a "Joined" tag instead of a heart on cards, the ride header and the Saved screen, and never count as saved. The home widget looks up every live booked ride (cap 20), lets a failed lookup fail the next-trip query, and labels "Your next trip" only when the query succeeded. Manage sends only `seatsTotal` (the server derives open seats under the lock; 409/400 are shown), the helper reads "N seats not open", delete navigates first then removes the owner query and invalidates `['rides']` in the background, the owner query does not retry 403/404, and pull-to-refresh also refetches bookings and participants. The ride page shows a compact retryable error in the seat panel when the rider's own bookings/requests fail, keeps booking disabled until they load, and shows the seated-rider UI (Your booking, Open chat, Rate driver) only when the viewer holds a seat (`!isDriver && seat`), not for admins. Publishing invalidates `['rides']`. `contributionAmount("Free")` is 0, so Manage and templates show 0. Global search shows "Rides: <query>" as a suggestion row outside the result count.
- Search results skip the server's passenger check (`RideViews.searchViews`), so `useSavedRides` also exposes `isJoined` from `/rides/saved` (which does compute membership) and search cards pass it to `RideCard joined` to show "Joined" instead of a heart.
- Paged responses (2026-10-12): `GET /api/v1/rides/offers` returns a `PagedModel` (`{ content, page }`, no `last`). `listRideOffersPage` normalizes it with `toPage`; `RidePage.total` is always a number and `hasMore` is `!page.last`.
- Member labels (2026-10-12): `memberLabel` uses the first 6 characters of the user id (was 4) so two riders rarely share a label until profiles exist.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['carpool', 'ride share', 'airport', 'pickup', 'commute', 'drive', 'travel']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
