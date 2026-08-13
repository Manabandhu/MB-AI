---
name: manabandhu-rooms
description: Maintain ManaBandhu room discovery, search, map, filters, saved rooms, listings, creation, editing, details, privacy, and moderation handoff. Use for any change under the rooms module or its contracts.
---

# Rooms

1. Read `frontend/src/modules/rooms/MODULE.md` and affected contracts before implementation.
2. Keep room screens, state, API adapters, schemas, and tests inside the module with explicit public exports.
3. First-batch room routes `/rooms`, `/rooms/search`, `/rooms/map`, `/rooms/filters`, `/rooms/saved`, `/rooms/my-listings`, `/rooms/create-listing`, `/rooms/[roomId]`, and `/rooms/[roomId]/edit` share `frontend/src/modules/rooms/screens/RoomsScreen.tsx` and read public demo content from `GET /api/v1/rooms/screens/{screenId}`.
4. Protect precise location and contact data; enforce listing ownership, availability, reporting, and moderation server-side.
5. Test map/list synchronization, filters, pagination, saves, empty/error states, and adaptive layouts.
6. Update contracts, module documentation, and this skill together.
