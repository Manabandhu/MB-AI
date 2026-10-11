# Rides

Ride discovery, offers, bookings, seat requests, participants, history, ratings, and driver management. Backend:
`/api/v1/rides` (`RidesController`), maps proxy `/api/v1/rides/maps/*` (`RideMapsController`).

## Routes
| Route | Screen | Auth |
| --- | --- | --- |
| `/rides`, `/rides/search`, `/rides/map`, `/rides/filters` | `RidesScreen` (`screenId` picks the initial view: list, map, or filters open) | public |
| `/rides/offer` | `RideOfferScreen` | sign-in |
| `/rides/request` | `RideRequestScreen` (Find a ride → `/rides/search?from=&to=`) | sign-in |
| `/rides/saved` | `RideSavedScreen` | sign-in |
| `/rides/mine` | `RideMyListingsScreen`: tabs Driving and My trips (`?tab=trips`) | sign-in |
| `/rides/history` | `RideHistoryScreen` | sign-in |
| `/rides/[rideId]` | `RideDetailScreen` | public; member fields when signed in as a member |
| `/rides/[rideId]/manage` | `RideManageScreen` | driver |
| `/rides/[rideId]/seat-requests` | `RideSeatRequestsScreen` | driver sees all, rider sees own |
| `/rides/[rideId]/participants` | `RideParticipantsScreen` | members |
| `/rides/[rideId]/rate` | `RideRateScreen` | members, after completion |

Route files in `frontend/src/app/rides*` are thin wrappers.

## Data
- `types.ts` defines `Ride` (the screens' view of the backend `RideOfferView`), `RideBooking`, `RideSeatRequest`,
  `RideParticipant`, `RideRating`. `api.ts` maps every backend shape in one place (`toRide` etc.); screens never read
  backend field names. `Ride.routeLabel` is `originArea → destinationArea`; `contributionLabel` is `$12 / seat` or
  `Free`. `title`/`pickupArea`/`destination` are legacy aliases kept for `foundation/screens/SavedScreen.tsx`.
- Statuses are lowercased by the mapper; compare with `statusIs` (`utils/rideFormat.ts`), never with `===`.
- `driverId`, `conversationId`, `routePolyline` exist only for members (`isMember`); non-members get coordinates
  rounded to 2 decimals, so the map shows approximate pickup areas.

| Function | Endpoint |
| --- | --- |
| `listRideOffers(params)` | `GET /offers?origin&destination&avoidTolls&genderPreference&isRecurring&page=0&size=50` |
| `getRide`, `getRideForOwner` | `GET /offers/{id}`, `GET /offers/{id}/owner` |
| `createRideOffer`, `updateRideOffer` | `POST /offers`, `PATCH /offers/{id}` (seats and contribution only) |
| `updateRideStatus` | `PATCH /offers/{id}/status` (`in_progress`, `completed`, `cancelled`) |
| `deleteRide`, `reactivateRideOffer(id, newDepartureAt)` | `DELETE /offers/{id}`, `POST /offers/{id}/re-activate` |
| `getMyRides`, `getRideHistory`, `getSavedRides` | `GET /mine`, `GET /history`, `GET /saved` |
| `saveRide`, `unsaveRide` | `POST`/`DELETE /{id}/favorite` |
| `bookRideSeat`, `listRideBookings`, `getMyBookings`, `cancelBooking` | `POST`/`GET /offers/{id}/bookings`, `GET /my-bookings`, `PATCH /bookings/{id}/status` |
| `listSeatRequests`, `updateSeatRequestStatus` | `GET /offers/{id}/requests`, `PATCH /requests/{id}/status` |
| `listParticipants` | `GET /offers/{id}/participants` |
| `submitRideRating`, `listRideRatings` | `POST`/`GET /offers/{id}/ratings` |
| `provisionRideChat` | `POST /offers/{id}/chat` |

Query keys: `['rides','offers',…]`, `['rides','detail',id]`, `['rides','owner',id]`, `['rides','mine']`,
`['rides','my-bookings']`, `['rides','history']`, `['rides','saved']`, `['rides','bookings',id]`,
`['rides','seat-requests',id]`, `['rides','participants',id]`, `['rides','home-widget']`.

## Components and helpers
- `components/RideListCard` (list row for saved/history/mine/trips), `DeparturePicker` (thin wrapper over the shared
  `DateTimeField`, today through 30 days ahead; selectable pills use the shared `Chip`), `RepeatTripSheet` (asks for the new departure, defaulting to the original time
  of day on the next future day), `RideLocationPicker` (debounced place suggestions; typing clears coordinates).
- `services/googleMapsService.ts`: route facts come only from the Directions proxy. On failure the result has no
  route and a message, and the ride is posted without distance/duration. 429 shows `MAPS_RATE_LIMIT_MESSAGE`.
  Autocomplete/geocode fall back to OpenStreetMap Photon when the proxy is unavailable (not on 429).
- `utils/rideFormat.ts` (pure, tested by `frontend/test/rideFormat.test.mjs`): `statusIs`, `contributionLabel`,
  `seatsError` (1–8), `amountError`, `departureError`, `nextDepartureAtSameTime`, `bookingBlockReason`, labels.
- `utils/notify.ts`: `showError`/`showMessage`/`confirmAction` that also work on web (copy of the rooms helper).

## Behaviour rules
- Booking is instant (`Book seat` → confirm → "Seat booked. The driver can see your booking."). It is hidden, with
  the reason shown, for the driver and for full, cancelled, completed, in-progress or departed rides. Women-only rides
  explain that only verified riders can book; the server enforces it (403).
- Chat and Participants are shown only to members; Manage and seat-request decisions only to the driver.
- Status changes use `PATCH /status` and ask for confirmation; cancelling releases and notifies riders. There is no
  activate/deactivate toggle (finished rides are final; use Repeat trip).
- Ratings are enabled only for completed rides: a passenger rates the driver (no `rateeId`); the driver picks a
  rider from the participants list. Duplicates are refused by the server (409) and the message is shown.
- Every list has pull-to-refresh and loading, empty and error-with-retry states; every failed mutation shows the
  server's reason. No sample data, invented counts, badges, fees or passengers.
- Member names are short id labels (`Rider ABCD`) until a public profile lookup exists.

## Not yet built
- Creating a seat request from the ride page (backend `POST /offers/{id}/requests` exists; the UI books instantly).
- `PATCH /offers/{id}/seats` (open/block seats) is not used; Manage edits seat counts through `PATCH /offers/{id}`.
