# Rides

Owns ride discovery, offers, requests, seats, participants, history, ratings, location sharing, safety state, and ride management.

## Routes
- `/rides` -> `RidesScreen` screenId="home"
- `/rides/search` -> `RidesScreen` screenId="search"
- `/rides/map` -> `RidesScreen` screenId="map"
- `/rides/filters` -> `RidesScreen` screenId="filters"
- `/rides/offer` -> `RideOfferScreen`
- `/rides/request` -> `RideRequestScreen`
- `/rides/saved` -> `RidesScreen` screenId="saved"
- `/rides/mine` -> `RidesScreen` screenId="mine"
- `/rides/history` -> `RidesScreen` screenId="history"
- `/rides/[rideId]` -> `RideDetailScreen`
- `/rides/[rideId]/manage` -> `RideManageScreen`
- `/rides/[rideId]/seat-requests` -> `RidesScreen` screenId="seat-requests"
- `/rides/[rideId]/participants` -> `RidesScreen` screenId="participants"
- `/rides/[rideId]/rate` -> `RideRateScreen`

## Screens
- `RidesScreen` - Multi-mode catalog/list screen driven by `screenId` prop (home, search, map, filters, offer, request, saved, mine, history, details, manage, seat-requests, participants, rate).
- `RideDetailScreen` - Placeholder for ride detail with route, timeline, seat state, and safety controls.
- `RideManageScreen` - Placeholder for ride management form.
- `RideOfferScreen` - Placeholder for ride offer creation form.
- `RideRequestScreen` - Placeholder for ride request creation form.
- `RideRateScreen` - Placeholder for ride rating form.

## API
- `getRidesScreen(screenId)` -> `GET /api/v1/rides/screens/${screenId}`
- `getRideDetail(rideId)` -> `GET /api/v1/rides/${rideId}`
- `getRideManage(rideId)` -> `GET /api/v1/rides/${rideId}/manage`
- `createRideOffer()` -> `POST /api/v1/rides/offer`
- `createRideRequest()` -> `POST /api/v1/rides/request`
- `submitRideRating(rideId)` -> `POST /api/v1/rides/${rideId}/rate`

## Fallbacks
- `rideScreenFallbacks` - Realistic demo data for all ride screenIds.
