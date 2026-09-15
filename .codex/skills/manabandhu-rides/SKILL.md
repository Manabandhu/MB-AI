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
| `/rides/search` | `RidesScreen` (`screenId="search"`) | list | loading, empty, error |
| `/rides/map` | `RidesScreen` (`screenId="map"`) | map | loading, empty, error, permission |
| `/rides/filters` | `RidesScreen` (`screenId="filters"`) | filter | normal |
| `/rides/offer` | `RideOfferScreen` | form | normal, error, success, loading |
| `/rides/request` | `RideRequestScreen` | form | normal, error, success, loading |
| `/rides/saved` | `RidesScreen` (`screenId="saved"`) | list | loading, empty, error |
| `/rides/mine` | `RidesScreen` (`screenId="mine"`) | list | loading, empty, error |
| `/rides/history` | `RidesScreen` (`screenId="history"`) | list | loading, empty, error |
| `/rides/[rideId]` | `RideDetailScreen` | detail | loading, error |
| `/rides/[rideId]/manage` | `RideManageScreen` | form | normal, error, success, loading |
| `/rides/[rideId]/seat-requests` | `RidesScreen` (`screenId="seat-requests"`) | list | loading, empty, error |
| `/rides/[rideId]/participants` | `RidesScreen` (`screenId="participants"`) | list | loading, empty, error |
| `/rides/[rideId]/rate` | `RideRateScreen` | form | normal, success |

## Component Inventory

- `RidesScreen` - multi-mode catalog/list/map screen driven by `screenId` prop; uses `UniversalMapView` for real route and corridor map view with freehand draw-to-filter corridor search and point-in-polygon filtering
- `RideDetailScreen` - placeholder for ride detail with route, timeline, seat state, and safety controls
- `RideManageScreen` - placeholder for ride management form
- `RideOfferScreen` - placeholder for ride offer creation form
- `RideRequestScreen` - placeholder for ride request creation form
- `RideRateScreen` - placeholder for ride rating form
- Shared: `UniversalMapView`, `geoPolygon` (`isPointInPolygon`), `FeatureScreen`, `SearchBar`, `FilterBar`, `Card`, `MapPreview`, `AppButton`, `SectionHeader`, `EmptyState`, `ErrorState`, `LoadingState`, `Timeline`, `StarRating`, `DateTimePicker`, `MapPicker`, `Select`, `SwipeAction`

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

- Home actions: Search, Map, Offer ride
- Search actions: Filters, Map, Offer ride
- Map actions: Search list, Filters
- Filters actions: Apply to search, Map
- Detail/manage actions: Seat requests, Participants, Rate
- Cross-module: deep link from explore, saved, and community

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rides/` are thin wrappers
- `RidesScreen` uses `useQuery` with backend API data
- `FeatureScreen` provides adaptive catalog/list layout
- In `RideOfferRepository`, `searchActive` JPQL query uses explicit `cast(:param as String)` for nullable text parameters (`:origin`, `:destination`, `:genderPreference`) to prevent PostgreSQL type inference as bytea when evaluating `LOWER()`
- Ride offer, request, manage, and rate screens are placeholders pending backend forms
- Map view is a placeholder pending real map integration

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Bottom sheets and modals respect safe area insets
- Color is not the only indicator of state

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

