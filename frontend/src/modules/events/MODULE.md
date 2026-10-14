# Events

Owns event discovery, search, details, creation, saves, user events, attendance, time zones, locations, and moderation handoff.

## Component Inventory

- `frontend/src/modules/events/api.ts` - Typed API client for events, search, and attendance.
- `frontend/src/modules/events/screens/EventsHomeScreen.tsx` - Discover events catalog.
- `frontend/src/modules/events/screens/EventsSearchScreen.tsx` - Search events list.
- `frontend/src/modules/events/screens/EventDetailsScreen.tsx` - Event detail view.
- `frontend/src/modules/events/screens/CreateEventScreen.tsx` - Create new event form.
- `frontend/src/modules/events/screens/SavedEventsScreen.tsx` - Saved events list.
- `frontend/src/modules/events/screens/MyEventsScreen.tsx` - Manage own events.
- Phase 1 (2026-10-14): see `.codex/skills/manabandhu-events/SKILL.md` for the current API surface, removed fake features, and known gaps.
