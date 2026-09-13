---
name: manabandhu-events
description: Maintain ManaBandhu event discovery, search, details, creation, saves, attendance, user events, time zones, locations, and moderation. Use for any change under the events module or its contracts.
---

# Events

## Module Purpose and Ownership

Owns event discovery, search, details, creation, saves, user events, attendance, time zones, locations, and moderation handoff.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/events` | `EventsHomeScreen` | catalog | loading, empty, error |
| `/events/search` | `EventsSearchScreen` | list | loading, empty, error |
| `/events/[eventId]` | `EventDetailsScreen` | detail | loading, error |
| `/events/create` | `CreateEventScreen` | form | normal, error, success, loading |
| `/events/saved` | `SavedEventsScreen` | list | loading, empty, error |
| `/events/mine` | `MyEventsScreen` | list | loading, empty, error |

## Component Inventory

- `EventsHomeScreen` - discover events catalog with search
- `EventsSearchScreen` - search events list
- `EventDetailsScreen` - event detail view with timeline and map preview
- `CreateEventScreen` - create new event form
- `SavedEventsScreen` - saved events list
- `MyEventsScreen` - manage own events
- Shared: `CatalogScreen`, `SearchBar`, `FilterBar`, `Card`, `AppButton`, `DetailScreen`, `MapPreview`, `Timeline`, `SectionHeader`, `ListScreen`, `FormScreen`, `DateTimePicker`, `TextArea`, `ImageUpload`, `EmptyState`, `ErrorState`, `LoadingState`, `SwipeAction`

## API Surface

- `listEvents()` -> `GET /api/v1/events`
- `searchEvents(query)` -> `GET /api/v1/events/search?q={query}`
- `getEvent(id)` -> `GET /api/v1/events/{id}`
- `createEvent(input)` -> `POST /api/v1/events`
- `listSavedEvents()` -> `GET /api/v1/events/saved`
- `listMyEvents()` -> `GET /api/v1/events/mine`

## Demo Fixtures

- `frontend/src/modules/events/eventsFallbacks.ts` - demo fixtures for all events screens

## State Patterns

- **Loading**: `LoadingState` while events load
- **Empty**: `EmptyState` with action to search or create event
- **Error**: `ErrorState` with retry action
- **Success**: navigation to event detail or home after create
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Home -> Search -> Details -> Create -> Saved -> My Events
- Search results navigate to event details
- Create event navigates to home on success
- Deep links to events from explore and saved

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/events/` are thin wrappers
- Uses `useQuery` and `useMutation` from `@tanstack/react-query`
- Forms use `react-hook-form` + `zod` + `@hookform/resolvers`
- Events store instants in UTC and render locale-aware dates
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

- Recent implementation: Generated Stitch MCP mobile designs (`f3ea9ea291424d759cf85d9786cc8bcc` for Events & Meetups Discovery and `203a0524f000487e9b1384e8d484e701` for Event Details & Free RSVP). Replaced fallback screen with live Supabase events feed via Spring Boot (`/api/v1/events`), rich category chips, Austin Diwali Mela featured spotlight, detailed festival timeline, venue amenities, social proof attendee clusters, and digital RSVP ticket modal. Unblocked public unauthenticated event discovery.
