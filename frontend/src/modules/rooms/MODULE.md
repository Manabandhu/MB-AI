# Rooms

Owns room discovery, map/search/filter state, saved rooms, listings, listing creation/editing, details, availability, location privacy, and moderation handoff.

## Routes
- `/rooms` -> `RoomsScreen` screenId="home"
- `/rooms/search` -> `RoomsScreen` screenId="search"
- `/rooms/map` -> `RoomsScreen` screenId="map"
- `/rooms/filters` -> `RoomsScreen` screenId="filters"
- `/rooms/saved` -> `RoomsScreen` screenId="saved"
- `/rooms/my-listings` -> `RoomsScreen` screenId="my-listings"
- `/rooms/create-listing` -> `RoomCreateScreen`
- `/rooms/[roomId]` -> `RoomDetailScreen`
- `/rooms/[roomId]/edit` -> `RoomEditScreen`

## Screens
- `RoomsScreen` - Multi-mode catalog/list screen driven by `screenId` prop (home, search, map, filters, saved, my-listings, create-listing, details, edit).
- `RoomDetailScreen` - Placeholder for room detail with price, availability, household fit, and contact handoff.
- `RoomEditScreen` - Placeholder for room listing edit form.
- `RoomCreateScreen` - Placeholder for room listing creation form.

## API
- `getRoomsScreen(screenId)` -> `GET /api/v1/rooms/screens/${screenId}`
- `getRoomDetail(roomId)` -> `GET /api/v1/rooms/${roomId}`
- `getRoomEdit(roomId)` -> `GET /api/v1/rooms/${roomId}/edit`
- `createRoomListing()` -> `POST /api/v1/rooms/create-listing`

## Fallbacks
- `roomScreenFallbacks` - Realistic demo data for all room screenIds.
