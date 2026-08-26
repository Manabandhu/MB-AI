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

- `getRidesScreen(screenId)` -> `GET /api/v1/rides/screens/{screenId}`
- `getRideDetail(rideId)` -> `GET /api/v1/rides/{rideId}`
- `getRideManage(rideId)` -> `GET /api/v1/rides/{rideId}/manage`
- `createRideOffer()` -> `POST /api/v1/rides/offer`
- `createRideRequest()` -> `POST /api/v1/rides/request`
- `submitRideRating(rideId)` -> `POST /api/v1/rides/{rideId}/rate`

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

- **Partial**: Home, search, filters, saved, mine, history, seat-requests, and participants screens are complete via `FeatureScreen`. Ride detail, manage, offer, request, and rate screens are placeholders. Map view is a placeholder pending real map integration.
