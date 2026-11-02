# Rides

Ride discovery, offers, bookings, seat requests, participants, history, ratings, and driver management. Backend:
`/api/v1/rides` (`RidesController`), maps proxy `/api/v1/rides/maps/*` (`RideMapsController`).

## Routes
| Route | Screen | Auth |
| --- | --- | --- |
| `/rides`, `/rides/search`, `/rides/map`, `/rides/filters` | `RidesScreen` (`screenId` picks the initial view: list, map, or the When/Sort sheet open; `?from=&to=` prefill) | public |
| `/rides/offer` | `RideOfferScreen` | sign-in |
| `/rides/request` | redirect → `/rides/search` (keeps `from`/`to`) | — |
| `/rides/saved` | `RideSavedScreen` | sign-in |
| `/rides/mine` | `RideMyListingsScreen`: tabs Driving and Riding (`?tab=riding`, old `?tab=trips` works), upcoming only | sign-in |
| `/rides/history` | `RideHistoryScreen` | sign-in |
| `/rides/[rideId]` | `RideDetailScreen` | public; member fields when signed in as a member |
| `/rides/[rideId]/manage` | `RideManageScreen`: tabs Overview, Requests, Riders (`?tab=requests|riders`); non-drivers are sent to the ride page | driver |
| `/rides/[rideId]/seat-requests` | redirect → `manage?tab=requests` (notification links) | — |
| `/rides/[rideId]/participants` | redirect → `manage?tab=riders` | — |
| `/rides/[rideId]/rate` | `RideRateScreen` | members, after completion |

Route files in `frontend/src/app/rides*` are thin wrappers or `<Redirect>`s.

## Data
- `types.ts` defines `Ride` (the screens' view of the backend `RideOfferView`), `RideBooking`, `RideSeatRequest`,
  `RideParticipant`, `RideRating`. `api.ts` maps every backend shape in one place (`toRide` etc.); screens never read
  backend field names. `Ride.routeLabel` is `originArea → destinationArea`; `contributionLabel` is `$12 / seat` or
  `Free`. (The old `title`/`pickupArea`/`destination` aliases are gone.)
- Statuses are lowercased by the mapper; compare with `statusIs` (`utils/rideFormat.ts`), never with `===`.
- `driverId`, `conversationId`, `routePolyline` exist only for members (`isMember`); non-members get coordinates
  rounded to 2 decimals, so the map shows approximate pickup areas.

| Function | Endpoint |
| --- | --- |
| `listRideOffersPage(params)` | `GET /offers?origin&destination&avoidTolls&genderPreference&isRecurring&page&size=50` → `{ rides, page, total, hasMore }` |
| `listRideOffers(params)` | first page only (home widget, `size=10`) |
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
`['rides','seat-requests',id]`, `['rides','participants',id]`, `['rides','home-widget']`, `['rides','home-next-trip']`.
Mutations that change seats or membership (book, cancel, withdraw, accept/decline, status, repeat, edit) invalidate
the whole `['rides']` prefix.

## Components and helpers
- `components/RideCard` (the one ride card: price, route, departure, seats, `StatusBadge` when `showStatus`, record
  facts as tag chips, heart; summary and heart are sibling pressables), plus `formatDeparture`, `seatsText`, `rideTags`.
- `components/InlineNotice` + `hooks/useTimedNotice`: success notices rendered beside the action that caused them,
  cleared after 6 s. Failures still go through `showError`.
- `hooks/useSavedRides`: `GET /saved` plus a heart toggle (`POST`/`DELETE /{id}/favorite`); signed-out → sign-in.
  `/saved` also lists rides the viewer rides on (no bookmark flag); `isJoinedRide` rides show a "Joined" tag instead
  of a heart and are never counted as saved.
- `components/RideFormScreen` + `useFormScroll`: the offer form frame (form width, keyboard avoiding) with a scroll
  handle so Publish scrolls to the first section with an error. Built locally because the shared `Screen` does not
  expose its scroll view.
- `DeparturePicker` (thin wrapper over the shared `DateTimeField`, today through 30 days ahead), `RepeatTripSheet`
  (asks for the new departure, defaulting to the original time of day on the next future day), `RideLocationPicker`
  (debounced place suggestions; typing clears coordinates; also the From/To fields on search).
- `mapsApi.ts`: route facts come only from the Directions proxy. On failure the result has no
  route and a message, and the ride is posted without distance/duration. 429 shows `MAPS_RATE_LIMIT_MESSAGE`.
  Autocomplete/geocode fall back to OpenStreetMap Photon when the proxy is unavailable (not on 429).
- `utils/rideFormat.ts` (pure, tested by `frontend/test/rideFormat.test.mjs` and `rideBooking.test.mjs`): `statusIs`,
  `statusTone`, `contributionLabel`, `seatsError` (1–8), `amountError`, `departureError`, `nextDepartureAtSameTime`,
  `bookingBlockReason` (members count as seated), `viewerSeat`, `departsInWindow`, `hasLuggageSpace`, `heldSeats`,
  `rideSearchHref` (public, used by global search), labels.
- `utils/notify.ts`: re-exports the shared `showError`/`showMessage`/`confirmAction`; screens confirm with `useConfirm`.

## Behaviour rules
- Booking is instant: the sticky bar's `Book N seats` → confirm → "Seat booked…" beside the seat panel. It is
  hidden, with the reason shown, for the driver, for members (they see "Your booking" with Open chat and Cancel
  booking, or "Your seat request" with Withdraw), and for full, cancelled, completed, in-progress or departed rides.
  Women-only rides explain that only verified riders can book; the server enforces it (403).
- Riders cannot create a seat request in the app; copy never promises it. Drivers see any requests in Manage.
- Search filters origin, destination, tolls, women-only and recurring on the server; When, Luggage and a drawn map
  area filter the loaded pages, and while more pages exist the screen says so and offers "Load more".
- Chat and "On this ride" are shown only to members; Manage and seat-request decisions only to the driver.
- Status changes use `PATCH /status` with a confirm (destructive only for cancel). Manage's total-seats stepper sends
  only `seatsTotal` (the server derives open seats under the lock); its minimum is the seats not open, and server
  409/400 refusals are shown. Cancel and Delete sit
  in a Danger zone that explains the difference.
- Ratings are enabled only for completed rides: a passenger rates the driver (no `rateeId`); the driver picks a
  rider from the participants list. Duplicates are refused by the server (409) and the message is shown.
- Every list has pull-to-refresh and loading, empty and error-with-retry states; every failed mutation shows the
  server's reason. No sample data, invented counts, badges, fees or passengers.
- Member names are short id labels (`Rider ABCD`) until a public profile lookup exists.

## Not yet built
- Creating a seat request from the ride page (backend `POST /offers/{id}/requests` exists; the UI books instantly).
- `PATCH /offers/{id}/seats` (open/block seats) is not used; Manage edits seat counts through `PATCH /offers/{id}`.
