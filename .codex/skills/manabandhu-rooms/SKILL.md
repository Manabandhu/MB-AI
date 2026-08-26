---
name: manabandhu-rooms
description: Maintain ManaBandhu room discovery, search, map, filters, saved rooms, listings, creation, editing, details, privacy, and moderation handoff. Use for any change under the rooms module or its contracts.
---

# Rooms

## Module Purpose and Ownership

Owns room discovery, search, map, filters, saved rooms, listings, listing creation/editing, details, availability, location privacy, and moderation handoff.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/rooms` | `RoomsScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/rooms/search` | `RoomsScreen` (`screenId="search"`) | list | loading, empty, error |
| `/rooms/map` | `RoomsScreen` (`screenId="map"`) | map | loading, empty, error, permission |
| `/rooms/filters` | `RoomsScreen` (`screenId="filters"`) | filter | normal |
| `/rooms/saved` | `RoomsScreen` (`screenId="saved"`) | list | loading, empty, error |
| `/rooms/my-listings` | `RoomsScreen` (`screenId="my-listings"`) | list | loading, empty, error |
| `/rooms/create-listing` | `RoomCreateScreen` | form | normal, error, success, loading |
| `/rooms/[roomId]` | `RoomDetailScreen` | detail | loading, error |
| `/rooms/[roomId]/edit` | `RoomEditScreen` | form | normal, error, success, loading |

## Component Inventory

- `RoomsScreen` - multi-mode catalog/list screen driven by `screenId` prop
- `RoomDetailScreen` - placeholder for room detail with price, availability, and contact handoff
- `RoomEditScreen` - placeholder for room listing edit form
- `RoomCreateScreen` - placeholder for room listing creation form
- Shared: `FeatureScreen`, `SearchBar`, `FilterBar`, `Card`, `MapPreview`, `AppButton`, `SwipeAction`, `ImageUpload`, `SectionHeader`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `GET /api/v1/rooms/screens/{screenId}` - catalog screen content
- `GET /api/v1/rooms/listings` - list active listings (params: `location`, `roomType`)
- `POST /api/v1/rooms/listings` - create listing (authenticated)
- `GET /api/v1/rooms/listings/{listingId}` - get listing by ID
- `PATCH /api/v1/rooms/listings/{listingId}` - update listing
- `DELETE /api/v1/rooms/listings/{listingId}` - delete listing
- `GET /api/v1/rooms/my-listings` - list owner's listings (authenticated)
- `GET /api/v1/rooms/listings/{listingId}/images` - list images for a listing
- `POST /api/v1/rooms/listings/{listingId}/images` - add image to listing
- `DELETE /api/v1/rooms/images/{imageId}` - delete image
- `GET /api/v1/rooms/listings/{listingId}/availability` - list availability windows
- `POST /api/v1/rooms/listings/{listingId}/availability` - create availability window
- `DELETE /api/v1/rooms/availability/{availabilityId}` - delete availability
- `GET /api/v1/rooms/listings/{listingId}/bookings` - list bookings for a listing
- `POST /api/v1/rooms/listings/{listingId}/bookings` - create booking (authenticated)
- `GET /api/v1/rooms/bookings/{bookingId}` - get booking by ID
- `PATCH /api/v1/rooms/bookings/{bookingId}/status` - update booking status
- `DELETE /api/v1/rooms/bookings/{bookingId}` - cancel booking
- `GET /api/v1/rooms/my-bookings` - list requester's bookings (authenticated)
- `GET /api/v1/rooms/favorites` - list saved listings (authenticated)
- `POST /api/v1/rooms/listings/{listingId}/favorite` - save listing (authenticated)
- `DELETE /api/v1/rooms/listings/{listingId}/favorite` - remove saved listing (authenticated)

Backend services: `RoomListingService`, `RoomAvailabilityService`, `RoomBookingService`, `RoomImageService`, `RoomFavoriteService`.

## Demo Fixtures

- `frontend/src/modules/rooms/roomsFallbacks.ts` - realistic demo data for all room `screenId`s

## State Patterns

- **Loading**: `LoadingState` while screen content loads
- **Empty**: `EmptyState` with action to search or create listing
- **Error**: `ErrorState` with retry action
- **Success**: navigation on create/edit completion
- **Offline**: offline banner with cached data fallback
- **Permission**: permission banner for map screen with fallback list

## Navigation Actions and Cross-Module Links

- Home actions: Search, Map, Saved, Create listing
- Search actions: Filters, Map, Saved
- Map actions: Search list, Filters
- Filters actions: Apply to search, Map
- Saved actions: Room details, Search more
- My listings actions: Create listing, Edit listing
- Cross-module: deep link to `/rooms/[roomId]` from explore, saved, and search

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rooms/` are thin wrappers
- `RoomsScreen` uses `useQuery` with fallback data from `roomsFallbacks.ts`
- `FeatureScreen` provides adaptive catalog/list layout with actions and cards
- Map and filter behaviors are UI placeholders pending real geocoding and filter persistence
- Forms use `react-hook-form` + `zod` where implemented

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Bottom sheets and modals respect safe area insets
- Color is not the only indicator of state

## Current Implementation Status

- **Partial**: Backend REST API complete with full CRUD for listings, images, availability, bookings, and saved listings. Frontend screens (home, search, filters, saved, my-listings, map, create/edit/detail) remain catalog/placeholder pending integration with backend REST APIs.
