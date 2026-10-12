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

- `EventsHomeScreen` - discover events catalog with search, category filtering, and pull-to-refresh
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

- Frontend fallbacks removed in favor of backend API endpoints and loading/empty/error states.

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
- Hardcoded data cleanup: removed hardcoded attendee counts ("1,420 Desis Attending"), static capacity badges ("95% Capacity"), static carpool counts, and replaced static festival schedule in `EventDetailsScreen` with event-specific timeline derivation and generic schedule fallback; added `isCompact` adaptations and flex-resilient topBar layout in `EventsHomeScreen.tsx` to ensure zero overflow on narrow foldable cover screens; updated event details route with `useLocalSearchParams`.
- Event Host Creator overhaul: completely replaced legacy `FormScreen` in `CreateEventScreen.tsx` with a modern event hosting interface featuring category selector chips, quick date presets, in-person venue vs virtual event toggle, venue address input, capacity limits, and responsive layout.
- Repo-Wide Code Review & Defect Remediation: Enforced `keyboardShouldPersistTaps="handled"` on `CreateEventScreen.tsx` ScrollView, added `hitSlop` on back buttons across event screens, cleaned unused variables, and verified dynamic route parameter safety in `EventDetailsScreen.tsx`.
- Security & correctness hardening (2026-10): RSVPs upsert one row per user and event and require an existing event. `GET /api/v1/events/{id}/attendance` needs a JWT: organizers/admins see the guest list, others only their own RSVP (REST and GraphQL). Event API helpers and screens are typed (no `any`).
- Real events only (2026-10): the featured card is the first upcoming event from the live list (hidden when there are none); the hard-coded Diwali feature, attendee/capacity numbers and festival schedule were removed from the home, details and create screens.
- Cleanup: removed unused API exports and repository/GraphQL helpers.
- Event dates and times render with `formatDate` (`weekdayTime` on lists, `long` on detail) and `formatTimeRange` from `@manabandhu/core`.
- Public API: `events/index.ts` exports `moduleMeta` and `EventsHomeWidget` (next three upcoming events).
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- Known limitation: `GET /api/v1/events` pages published events ascending by start (default 20), so once more than a page of past events exists, the Events screen and `EventsHomeWidget` can miss upcoming ones. Fix in the events review with a backend `upcoming` filter rather than client-side paging.
- P0 fixes (2026-10-10): `GET /api/v1/events/saved` and GraphQL `savedEvents` used to return every event with status "saved" to anyone. Both now require a login and return only events the caller RSVPed to (`going|interested|maybe`) or saved (`saved`), soonest first, at most 200 (`EventsService.findSaved(Actor)` → `EventRepository.findSavedByUser`). RSVP statuses are stored lowercase from an allowlist (`going|interested|maybe|saved|not_going`, 400 otherwise); older uppercase rows still match through `lower()`. Malformed `startAt`/`endAt` return 400 (`EventsService.parseInstant`), as does `endAt` not after `startAt`. GraphQL `events` is capped at 100. `SavedEventsScreen` shows a sign-in prompt to signed-out visitors, has pull-to-refresh and real errors (`listSavedEvents` throws instead of returning `[]`). An RSVP refreshes the saved list.
- RSVP notifications go to the organiser only when the status actually changes to going or interested.
- Paged responses (2026-10-12): `GET /api/v1/events` and `/events/search` return a `PagedModel` (`{ content, page }`, documented as `EventPage`); `listEvents`/`searchEvents` read it through `toPage` from `@/lib/springPage`.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['festival', 'meetup', 'diwali', 'ugadi', 'networking', 'party', 'cultural']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
