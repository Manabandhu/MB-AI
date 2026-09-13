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

- `RoomsScreen` - multi-mode catalog/list screen driven by `screenId` prop; home/search now return real listing data
- `RoomDetailScreen` - real listing detail with save/unsave and contact handoff
- `RoomEditScreen` / `RoomCreateScreen` - real forms backed by `RoomForm` (react-hook-form + zod)
- `RoomForm` - shared create/edit form with validation
- `RoomFavoritesScreen` - real saved/favorite listings list
- `RoomMyListingsScreen` - real owner listings list
- `RoomInquiryScreen` - inquiry form that creates a booking for the listing
- Shared: `FeatureScreen`, `SearchBar`, `AppButton`, `TextArea`, `SectionHeader`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

Public catalog:
- `GET /api/v1/rooms/screens/{screenId}` - catalog screen content (home/search return real listings)
- `GET /api/v1/rooms/listings` - list published listings (params: `location`, `roomType`)
- `GET /api/v1/rooms/{roomId}` - public listing detail (**never returns exactAddress**)

Authenticated owner:
- `POST /api/v1/rooms/listings` - create listing (owner derived from JWT)
- `GET /api/v1/rooms/{roomId}/owner` - owner detail (**includes exactAddress**)
- `PATCH /api/v1/rooms/{roomId}` - update listing (owner or admin only)
- `PATCH /api/v1/rooms/{roomId}/publish` · `/pause` · `/archive` - owner state transitions
- `DELETE /api/v1/rooms/{roomId}` - delete listing (owner or admin only)
- `GET /api/v1/rooms/my-listings` - owner's listings
- `GET /api/v1/rooms/listings/{listingId}/analytics` - owner-only analytics

Images, availability, bookings, favorites:
- `GET/POST /api/v1/rooms/{listingId}/images` · `DELETE /api/v1/rooms/images/{imageId}`
- `GET/POST /api/v1/rooms/{listingId}/availability` · `DELETE /api/v1/rooms/availability/{availabilityId}`
- `POST /api/v1/rooms/{listingId}/bookings` - submit inquiry (no self-inquiry, no duplicate pending)
- `GET /api/v1/rooms/{listingId}/bookings` - owner views listing inquiries
- `PATCH /api/v1/rooms/bookings/{bookingId}/status` - accept/reject/cancel (owner or requester)
- `GET /api/v1/rooms/my-bookings` - requester's inquiries
- `GET /api/v1/rooms/favorites` · `POST/DELETE /api/v1/rooms/{listingId}/favorite`

Saved searches, reports, moderation (all authenticated):
- `GET/POST /api/v1/rooms/saved-searches` · `PATCH/DELETE /api/v1/rooms/saved-searches/{searchId}`
- `POST /api/v1/rooms/listings/{listingId}/report` · `GET /api/v1/rooms/my-reports`
- `GET /api/v1/rooms/admin/reports` · `POST /api/v1/rooms/admin/reports/{reportId}/review` (admin only)
- `POST /api/v1/rooms/admin/listings/{listingId}/moderate` (admin only)

Backend services: `RoomListingService`, `RoomAvailabilityService`, `RoomBookingService`, `RoomImageService`, `RoomFavoriteService`, `RoomSavedSearchService`, `RoomReportService`, `RoomAnalyticsService`.

## Data Model

Migration `V16__extend_rooms.sql` adds `room_amenities`, `room_preferences`, `room_saved_searches`, `room_reports`, `room_analytics`, `room_moderation_actions`. Existing tables: `room_listings`, `room_images`, `room_availabilities`, `room_bookings`, `room_favorites`.

Listing statuses: `draft`, `active`, `paused`, `archived`, `rejected`. Booking statuses: `pending`, `accepted`, `rejected`, `cancelled`.

## Authorization and Privacy Rules

- **Exact address is never returned through public APIs.** `RoomListingResponse` omits it; only `OwnerRoomListingResponse` (owner/admin) includes it.
- Ownership is derived from the authenticated JWT (`authentication.getName()`), never from client input.
- Cross-user enforcement lives in the Spring service layer (the backend connects as the `postgres` superuser, which bypasses RLS, so RLS is defense-in-depth; service-layer checks are authoritative).
- Listing state transitions are validated server-side: draft→active/archived, active→paused/archived, paused→active/archived; rejected→active/draft is admin-only.
- Self-inquiry and duplicate-pending inquiries are rejected. Only the listing owner can accept/reject; only the requester can cancel.
- Reports: no self-reporting, no duplicate open reports. Review queue is admin-only.
- RLS policies exist on every rooms table: public read of published listings, owner write, admin override, participant-only booking access.

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

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rooms/` are thin wrappers.
- `RoomsScreen` uses `useQuery`; home/search now render real listings from the content service.
- Detail, create, edit, favorites, my-listings, and inquiry screens use TanStack Query against the real REST API.
- Forms use `react-hook-form` + `zod` with string-based numeric fields converted on submit.
- Save/unsave uses optimistic invalidation of the detail and favorites queries.

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Bottom sheets and modals respect safe area insets
- Color is not the only indicator of state

## Current Implementation Status

- **Complete**: End-to-end vertical slice across database (V16), backend (controllers/services/repositories/DTOs/authorization), REST contracts (openapi.yaml), and frontend (list, detail, create, edit, favorites, my-listings, inquiry). Service-layer authorization covers ownership, cross-user protection, address privacy, and state transitions. Backend tests cover authorization, transitions, and address protection.

- The legacy GraphQL rooms path and the `AdminRoomsScreen` retain their original shape; the canonical rooms APIs are REST under `/api/v1/rooms`.

- Recent backend fixes: rooms controller/service method signatures now consistently pass actor/admin flags, room listing ownership checks are enforced in services, and room booking/availability/delete flows require authenticated ownership or admin override.

- Recent backend changes: added aliased routes to `RoomsController` (`/{roomId}`, `/{roomId}/owner`, `/{roomId}` PATCH/DELETE, `/{roomId}/publish`, `/{roomId}/pause`, `/{roomId}/archive`) alongside existing `/listings/{listingId}` paths to match frontend API calls.
- Stitch Design Alignment for Rooms: Overhauled RoomsScreen.tsx and RoomDetailScreen.tsx matching Stitch designs (projects/9663298292574415459). RoomsScreen adds interactive search header with city/count picker, filter chips, Zero-Brokerage Guarantee trust assurance banner, featured subleases carousel, rich room feed cards with utility/deposit tags, and floating action button. RoomDetailScreen features gallery carousel, pricing breakdown card, verified host profile card, Desi flatmate compatibility badges, amenities checklist, and location privacy protection notice.
- Interactive City Selector, Filter Sheet, Sorting & Map View: Added interactive Metro Area modal (Austin, DFW, Houston, Bay Area, Seattle, Jersey City) with live room counts, quick sorting chips, and a segmented controller providing a vector-rendered Austin Map View with interactive price pins, pulse rings, and floating room preview card.
- Responsive Bottom-up / Web Centered Modal & Rich Iconography: Replaced separate modal with an adaptive Filters & Sorting modal that renders as a bottom-up bottom sheet on mobile screens with pull indicator, and as a centered dialog modal on web/desktop. Added rich icons to all amenities, filters, sort orders, category chips, and room cards.
- Live Backend & Supabase Database Seeding: Removed hardcoded UI listings. Seeded realistic room listings, amenities, and preferences into Supabase PostgreSQL (Austin tech corridors, Domain, UT Austin, Round Rock, Cedar Park, Downtown) and wired client to query live records through Spring Boot REST endpoint `listRoomListings()`. Unwrapped Spring Data `Page.content` format for seamless client mapping.
- Clean UI Layout: Removed zero-brokerage banners, guarantee banners, and featured subleases carousel from rooms discovery, saved rooms, and create listing screens for a cleaner, direct discovery experience.
- Hardcoded data cleanup: removed hardcoded host persona ("Karthik Raman"), static deposits and lease lengths from `RoomDetailScreen` in favor of dynamic room listing fields and verified member badges; removed demo autofill and mock submission bypass from `RoomForm` with real auth redirection to `/sign-in`; removed static city count numbers in `RoomsScreen` in favor of dynamic calculation from active listings.
