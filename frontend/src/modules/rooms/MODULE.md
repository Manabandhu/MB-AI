# Rooms

Owns room discovery, map/search/filter state, saved rooms, listings, listing creation/editing, details, availability, location privacy, and moderation handoff.

The first Stitch batch routes `/rooms`, `/rooms/search`, `/rooms/map`, `/rooms/filters`, `/rooms/saved`, `/rooms/my-listings`, `/rooms/create-listing`, `/rooms/[roomId]`, and `/rooms/[roomId]/edit` share `screens/RoomsScreen.tsx`, `roomsFallbacks.ts`, and the read-only demo endpoint `GET /api/v1/rooms/screens/{screenId}`.
