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

- `RoomsScreen` - multi-mode catalog/list/map screen driven by `screenId` prop; uses `UniversalMapView` (react-native-maps Apple Maps on iOS, MapKit JS on web) for real interactive map view with freehand draw-to-filter boundary search (Zillow/Apartments style) and point-in-polygon filtering
- `RoomDetailScreen` - real listing detail with save/unsave and contact handoff
- `RoomEditScreen` / `RoomCreateScreen` - real forms backed by `RoomForm` (react-hook-form + zod)
- `RoomForm` - shared create/edit form with validation
- `RoomFavoritesScreen` - real saved/favorite listings list
- `RoomMyListingsScreen` - real owner listings list
- `RoomInquiryScreen` - inquiry form that creates a booking for the listing
- Shared: `UniversalMapView`, `geoPolygon` (`isPointInPolygon`), `FeatureScreen`, `SearchBar`, `AppButton`, `TextArea`, `SectionHeader`, `EmptyState`, `ErrorState`, `LoadingState`

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

- Migration `V16__extend_rooms.sql` adds `room_listing_amenities`, `room_preferences`, `room_saved_searches`, `room_reports`, `room_analytics`, `room_moderation_actions`. Existing tables: `room_listings`, `room_images`, `room_availabilities`, `room_bookings`, `room_favorites`.
- Migration `V24__enhance_rooms_and_amenities.sql`:
  - Renames legacy listing-amenity junction to `room_listing_amenities`.
  - Creates dynamic master catalog `room_amenities` (`id`, `code`, `label`, `category`, `icon_name`, `is_active`, `sort_order`) seeded with 12 diaspora housing amenities.
  - Enhances `room_listings` with diaspora & transparent pricing attributes: `dietary_preference`, `gender_preference`, `bathroom_type`, `utilities_included`, `est_utility_monthly`, `security_deposit`, `lease_term`, `is_verified_host`, `university_shuttle_accessible`, `amenity_codes`, `state_code VARCHAR(10)`, `county`.
  - Creates `room_inquiries` table with RLS (`auth.uid() = sender_id OR auth.uid() = host_id`) linking inquiries directly to chat conversations.
- Migration `V26__widen_room_listings_columns.sql`:
  - Widens `room_type` from `VARCHAR(20)` → `VARCHAR(50)` to accommodate multi-word values (e.g. `"Entire House / Sublease"`).
  - Widens `state_code` from `VARCHAR(10)` → `VARCHAR(50)` for full state names from address autocomplete.
  - Drops and recreates `room_listings_status_valid` check constraint to include `'rejected'` (used by admin moderation flow): `('draft','active','paused','archived','rejected')`.
  - **Frontend `RoomForm.tsx` Zod schema** matches: `stateCode: z.string().max(50)` (was `max(10)`).

Listing statuses: `draft`, `active`, `paused`, `archived`, `rented`, `rejected`. Booking/Inquiry statuses: `pending`, `accepted`, `declined`, `cancelled`, `archived`.

## Free Zero-Cost Location & Geocoding Services

- `country-state-city`: Offline US states (`getUSStates()`) and cities by state (`getCitiesByState(stateCode)`) with zero network latency or API keys.
- OpenStreetMap Photon API (`https://photon.komoot.io/api/?q={query}&limit=5&bbox=-125,24,-66,49`): Instant address autocomplete and lat/lng coordinates for US bounds with zero billing/keys.
- Zippopotam.us (`https://api.zippopotam.us/us/{zip}`): 1-step ZIP code lookup returning city, state abbreviation, and coordinates.

## Real-Time Chat Handshake Invariant

- Contacting a host via `/rooms/[roomId]/inquiry` triggers `POST /api/v1/rooms/{roomId}/inquire`.
- Backend automatically creates a chat conversation with `type = ROOM_INQUIRY`, adds the host and sender as participants, and posts an introductory message containing a structured summary of the move-in date, stay duration, dietary preferences, and custom questions.
- Endpoint returns `{ inquiryId, conversationId }`.
- Frontend transitions seamlessly in 1 click directly to `/chat/[conversationId]`.

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
- Chat handoff: 1-click transition from room inquiry to `/chat/[conversationId]`

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/rooms/` are thin wrappers.
- `RoomsScreen` uses `useQuery`; home/search render live listings from the backend REST API with horizontal filter chips and city switcher.
- Detail, create, edit, favorites, my-listings, and inquiry screens use TanStack Query against the real REST API.
- Unified `RoomForm.tsx` consolidates creation and editing forms with react-hook-form + zod, live Photon address search, country-state-city chips, dynamic Supabase amenities catalog, and multi-image picker with thumbnail previews.
- Save/unsave uses optimistic invalidation of the detail and favorites queries.
- My Listings management supports tab filtering (`Active`, `Draft`, `Rented`) and a 3-dot action menu (`Edit`, `Mark as Rented`, and `Delete` modal with `#ba1a1a` destructive button).

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt with hitSlop for navigation icons
- Dual-pane reflow: Viewports width >= 1024px render dual-pane layout with 2-column scrollable cards on the left and sticky interactive map on the right
- Safe Area Insets: Top navigation and bottom action bars use `useSafeAreaInsets()` (`Math.max(insets.bottom, 16)`)
- Keyboard Avoidance: Forms wrap content with `KeyboardAvoidingView` (`behavior: Platform.OS === 'ios' ? 'padding' : 'height'`) and `keyboardShouldPersistTaps="handled"`
- Android Hardware Back: Modal sheets, city switchers, and filter overlays implement `BackHandler` listeners **guarded with `if (Platform.OS !== 'android') return;`** — never call `BackHandler` on web or iOS.
- Virtualization: FlatLists in list screens configure `initialNumToRender={6}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews={Platform.OS === 'android'}`
- Map screen requests location permission with education banner
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Color contrast meets WCAG 2.1 AA (at least 4.5:1 ratio)
- Color is not the only indicator of state

## Current Implementation Status

- **Complete**: End-to-end vertical slice across database (V16 & V24), backend (controllers/services/repositories/DTOs/authorization/chat handshake), REST contracts (openapi.yaml), and frontend (list, detail, create, edit, favorites, my-listings, inquiry).
- **Zero Hardcoding**: All dynamic amenities, lifestyles, preferences, and locations fetched from Supabase / REST backend.
- **Free Geocoding**: Integrated `country-state-city`, OpenStreetMap Photon autocomplete, and Zippopotam.us ZIP auto-fill.
- **Chat Handshake**: Direct 1-click transition from room inquiry into `/chat/[conversationId]`.
- **Code Consolidation**: Unified `RoomForm.tsx` eliminates duplication across create and edit screens.
- **Modern Vibrant Design**: Applied ManaBandhu design tokens (`#431ebe` primary, `#00696b` teal, `#131b2e` ink, `#faf8ff` background).
