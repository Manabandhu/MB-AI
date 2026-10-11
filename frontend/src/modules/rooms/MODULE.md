# Rooms

Room discovery (list, card, map, filters, city picker), saved rooms, listing creation and editing with photos and
amenities, owner listing management, listing detail, inquiries that open a chat with the host, and listing reports.
The governing skill is `.codex/skills/manabandhu-rooms/SKILL.md`.

## Routes (`frontend/src/app/rooms*`, thin wrappers)

| Route | Screen | Sign-in |
|---|---|---|
| `/rooms` | `RoomsScreen screenId="home"` | no |
| `/rooms/search` | `RoomsScreen screenId="search"` | no |
| `/rooms/map` | `RoomsScreen screenId="map"` | no |
| `/rooms/filters` | `RoomsScreen screenId="filters"` (filter sheet open) | no |
| `/rooms/saved` | `RoomFavoritesScreen` | `useRequireAuth` |
| `/rooms/my-listings` | `RoomMyListingsScreen` (`?notice=` shows the last save result) | `useRequireAuth` |
| `/rooms/create-listing` | `RoomCreateScreen` → `RoomForm mode="create"` | `useRequireAuth` |
| `/rooms/[roomId]` | `RoomDetailScreen` | no |
| `/rooms/[roomId]/edit` | `RoomEditScreen` → `RoomForm mode="edit"` | `useRequireAuth` |
| `/rooms/[roomId]/inquiry` | `RoomInquiryScreen` | `useRequireAuth` |

## Screens and components

- `RoomsScreen` – discovery on the shared primitives: `ScreenHeader` (city chip, Saved, My listings, one "Post a room"),
  search, quick filter chips, List | Map `SegmentedControl`. List = virtualised `FlatList` grid of `RoomCard`s (1/2/3
  columns); Map = `RoomsMap` (approximate pins, draw-an-area, map style/3D, center on me, selected room card). Sheets:
  `RoomFilterSheet` (sort + every filter) and `CityPickerSheet`. All filters live in one session store
  (`hooks/useRoomFilters`, pure rules in `utils/roomFilters.ts`); "Clear filters" resets search, chips, sheet filters
  and the drawn area. Filters use real listing fields only. `/rooms/search` focuses search, `/rooms/map` opens the map,
  `/rooms/filters` opens the sheet and returns to `/rooms` on close.
- `RoomDetailScreen` – photos from `GET /listings/{id}/images` (falls back to `coverImageUrl`, else a "No photos yet"
  placeholder), pricing (deposit only when set), household facts, amenities ("No amenities listed" when empty),
  approximate-area notice. Pull-to-refresh, two columns at expanded width. 404 → "Room not found"; other errors →
  message + Retry. Owners (`isOwner`) get an `ActionBar` with Edit + one status action (Pause/Publish/Relist) and a
  "More" sheet (Mark rented, Archive); everyone else gets Save, "Contact host" (inquiry form), "Quick hello" (direct
  inquiry → chat, errors alerted) and "Report listing" (radio reason chips + optional description → `reportRoom`).
- `RoomForm` – shared create/edit form (react-hook-form + zod). Photos go through `useImageUpload('rooms')` (progress,
  cancel, error), max 10; on save, unattached photos are attached in order with `addRoomImage`; removing an attached
  photo calls `deleteRoomImage` then `deleteUpload('rooms', url)`. Edit mode loads the existing images. Amenities are
  sent as `amenities: string[]` (catalog codes; edit mode preloads them from the owner response). Sticky `ActionBar`:
  "Publish now" (create, then publish) and "Save draft"; yes/no rows use a real `Switch`. A failed photo attach or publish shows the error and
  keeps the created listing id so the next save updates instead of creating a duplicate. State field `maxLength` 50;
  deposit/utility errors are shown inline. Address search (Photon) and ZIP lookup (Zippopotam) failures are shown.
- `RoomMyListingsScreen` – `OwnerItemCard`s (cover, `StatusBadge`) in a `ResponsiveGrid`; tabs Active (`active|paused`), Drafts (`draft|rejected`), Rented (`rented|archived`); actions
  publish/pause, mark rented (`PATCH {status:'rented'}`), relist (publish from rented), archive, edit, delete (`useConfirm`, destructive).
  Every mutation alerts on error and invalidates the rooms queries. Loading, error+retry, pull-to-refresh.
- `RoomFavoritesScreen` – `RoomCard` grid of the server list (`GET /favorites`) only; loading, error+retry, pull-to-refresh.
- `RoomInquiryScreen` – `DateTimeField` move-in date (not in the past); `EmptyState` when not accepting inquiries; "Flexible" sends
  `stayDurationMonths: null`; on success replaces with `/chat/[conversationId]`.
- `home/RoomsHomeWidget` – Home widget (public API via `index.ts`).

## State

- `savedRoomsStore` – optimistic cache of save/unsave choices keyed to the signed-in user id; entries are dropped
  once the server data is refetched. `clearSavedRooms()` is called by `authStore.signOut`. Use it only through
  `hooks/useRoomSave` (rollback + alert on failure, sign-in redirect for guests, query invalidation).
- Query keys: `['rooms','listings',{size:500}]` (discovery; not keyed by city), `['rooms','detail',id]`, `['rooms','owner',id]`, `['rooms','images',id]`,
  `['rooms','my-listings']`, `['rooms','favorites']`, `['rooms','amenities']`.

## API (`api.ts`)

| Function | Call |
|---|---|
| `getRoomAmenities` | `GET /api/v1/rooms/amenities` |
| `listRoomListings` | `GET /api/v1/rooms/listings` |
| `getRoomDetail` | `GET /api/v1/rooms/listings/{id}` |
| `getRoomForOwner` | `GET /api/v1/rooms/listings/{id}/owner` |
| `createRoomListing` | `POST /api/v1/rooms/listings` |
| `updateRoomListing` / `markRoomRented` | `PATCH /api/v1/rooms/listings/{id}` |
| `publishRoomListing` / `pauseRoomListing` / `archiveRoomListing` | `PATCH /api/v1/rooms/listings/{id}/publish` · `/pause` · `/archive` |
| `deleteRoomListing` | `DELETE /api/v1/rooms/listings/{id}` |
| `getMyListings` | `GET /api/v1/rooms/my-listings` |
| `getFavorites` / `saveRoom` / `unsaveRoom` | `GET /api/v1/rooms/favorites` · `POST`/`DELETE /api/v1/rooms/listings/{id}/favorite` |
| `inquireRoom` | `POST /api/v1/rooms/{id}/inquire` |
| `listRoomImages` / `addRoomImage` | `GET`/`POST /api/v1/rooms/listings/{id}/images` |
| `deleteRoomImage` | `DELETE /api/v1/rooms/images/{imageId}` |
| `reportRoom` | `POST /api/v1/rooms/listings/{id}/report` |

Auth failures (401/403) throw `AuthError`; nothing converts them into empty data.

## Rules

- Statuses are lowercase; compare with `statusIs` (case-insensitive).
- Public responses carry `isOwner`, never `ownerId`; coordinates are rounded to ~1 km and the exact address is only
  in the owner response.
- No invented content: no stock photos, default amenities, neighbourhood claims, or invented coordinates.
- Errors are shown with `utils/notify` (`showError`; confirmations use `useConfirm`/`confirmAction`, the shared `ConfirmSheet`).
- Back buttons use `shared/ui/BackButton` (falls back to a route when there is no history).
- Every rooms screen uses the shared UI primitives and theme tokens; the module has no colour literals left (the
  `rooms/screens/RoomsScreen.tsx` entry in `scripts/design-baseline.json` can drop to zero with `--update`).
