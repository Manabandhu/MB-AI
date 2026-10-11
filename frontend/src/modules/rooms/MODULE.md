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

- `RoomsScreen` – catalog with card/list/map views, dual pane at `breakpoint.expanded`, city picker, sort and filter
  sheets, drawn-area search. Filters use real listing fields only: `dietaryPreference`, `genderPreference`,
  `bathroomType`, and `amenities` (catalog codes from `GET /amenities`). Rooms without real coordinates are listed but
  never pinned on the map and never match a drawn area. The map shows loading, error (retry) and empty overlays.
  "Post a room" is the floating button (and the header button when signed out); signed-in members get "My listings"
  and "Saved" in the header.
- `RoomDetailScreen` – photos from `GET /listings/{id}/images` (falls back to `coverImageUrl`, else a "No photos yet"
  placeholder), pricing (deposit only when set), household facts, amenities ("No amenities listed" when empty),
  approximate-area notice ("Exact address is shared by the host in chat."). 404 → "Room not found"; other errors →
  message + Retry. Owners (`isOwner`) get Edit and Publish/Pause/Mark rented/Relist; everyone else gets Save,
  "Message host" (direct inquiry, errors alerted), "Details" (inquiry form) and "Report listing" (bottom sheet with
  reason chips + optional description → `reportRoom`, real result shown).
- `RoomForm` – shared create/edit form (react-hook-form + zod). Photos go through `useImageUpload('rooms')` (progress,
  cancel, error), max 10; on save, unattached photos are attached in order with `addRoomImage`; removing an attached
  photo calls `deleteRoomImage` then `deleteUpload('rooms', url)`. Edit mode loads the existing images. Amenities are
  sent as `amenities: string[]` (catalog codes; edit mode preloads them from the owner response). Primary button
  "Publish now" (create, then publish), secondary "Save draft". A failed photo attach or publish shows the error and
  keeps the created listing id so the next save updates instead of creating a duplicate. State field `maxLength` 50;
  deposit/utility errors are shown inline. Address search (Photon) and ZIP lookup (Zippopotam) failures are shown.
- `RoomMyListingsScreen` – tabs Active (`active|paused`), Drafts (`draft|rejected`), Rented (`rented|archived`); actions
  publish/pause, mark rented (`PATCH {status:'rented'}`), relist (publish from rented), archive, edit, delete (confirm).
  Every mutation alerts on error and invalidates the rooms queries. Loading, error+retry, pull-to-refresh.
- `RoomFavoritesScreen` – renders the server list (`GET /favorites`) only; loading, error+retry, pull-to-refresh.
- `RoomInquiryScreen` – validates the move-in date (YYYY-MM-DD, not in the past) inline; "Flexible" sends
  `stayDurationMonths: null`; on success replaces with `/chat/[conversationId]`.
- `home/RoomsHomeWidget` – Home widget (public API via `index.ts`).

## State

- `savedRoomsStore` – optimistic cache of save/unsave choices keyed to the signed-in user id; entries are dropped
  once the server data is refetched. `clearSavedRooms()` is called by `authStore.signOut`. Use it only through
  `hooks/useRoomSave` (rollback + alert on failure, sign-in redirect for guests, query invalidation).
- Query keys: `['rooms','listings',…]`, `['rooms','detail',id]`, `['rooms','owner',id]`, `['rooms','images',id]`,
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
- Errors are shown with `utils/notify` (`showError`/`confirmAction` use browser dialogs on web, `Alert` on native).
- Back buttons use `shared/ui/BackButton` (falls back to a route when there is no history).
- New code uses shared UI primitives and theme tokens; `RoomsScreen` still has legacy StyleSheet colours tracked by
  `scripts/design-baseline.json`.
