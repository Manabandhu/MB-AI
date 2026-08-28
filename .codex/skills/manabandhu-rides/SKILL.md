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

- `RidesScreen` - multi-mode catalog/list screen driven by `screenId` prop
- `RideDetailScreen` - placeholder for ride detail with route, timeline, seat state, and safety controls
- `RideManageScreen` - placeholder for ride management form
- `RideOfferScreen` - placeholder for ride offer creation form
- `RideRequestScreen` - placeholder for ride request creation form
- `RideRateScreen` - placeholder for ride rating form
- Shared: `FeatureScreen`, `SearchBar`, `FilterBar`, `Card`, `MapPreview`, `AppButton`, `SectionHeader`, `EmptyState`, `ErrorState`, `LoadingState`, `Timeline`, `StarRating`, `DateTimePicker`, `MapPicker`, `Select`, `SwipeAction`

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

- `frontend/src/modules/rides/ridesFallbacks.ts` - realistic demo data for all ride `screenId`s

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
- `RidesScreen` uses `useQuery` with fallback data from `ridesFallbacks.ts`
- `FeatureScreen` provides adaptive catalog/list layout
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
