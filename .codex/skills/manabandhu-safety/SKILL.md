---
name: manabandhu-safety
description: Maintain ManaBandhu safety center, reports, blocked users, trusted contacts, emergency escalation, evidence privacy, and moderation status. Use for any change under the safety module or its contracts.
---

# Safety

## Module Purpose and Ownership

Owns the safety center, user reports, blocked users, trusted contacts, emergency escalation, evidence privacy, and moderation status.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/safety` | `SafetyCenterScreen` | catalog | loading, empty, error |
| `/safety/reports` | `ReportsScreen` | list | loading, empty, error |
| `/safety/blocked-users` | `BlockedUsersScreen` | list | loading, empty, error |
| `/safety/trusted-contacts` | `TrustedContactsScreen` | list | loading, empty, error |

## Component Inventory

- `SafetyCenterScreen` - catalog screen using `FeatureScreen`
- `ReportsScreen` - list screen with filter chips, status badges, and `SectionHeader`
- `BlockedUsersScreen` - list screen with avatars, `SwipeAction`, and `SectionHeader`
- `TrustedContactsScreen` - list screen with avatars, add action, and `SectionHeader`
- Shared: `FeatureScreen`, `ScreenShell`, `SectionHeader`, `ListScreen`, `Card`, `AppButton`, `Avatar`, `SwipeAction`, `Banner`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `getSafetyCenter()` -> `GET /api/v1/safety/center`
- `getReports()` -> `GET /api/v1/safety/reports`
- `getBlockedUsers()` -> `GET /api/v1/safety/blocked-users`
- `getTrustedContacts()` -> `GET /api/v1/safety/trusted-contacts`

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` while safety data loads
- **Empty**: `EmptyState` when no reports, blocked users, or contacts exist
- **Error**: `ErrorState` with retry action
- **Success**: confirmation after block/unblock or contact add
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Safety center actions: Reports, Blocked users, Trusted contacts
- Back navigation to safety center from all sub-screens
- Cross-module: blocking takes effect across discovery, chat, community, rooms, rides, jobs, events, and marketplace

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/safety/` are thin wrappers
- Uses `useQuery` for all safety data fetching
- Blocking is UI-complete; enforcement across modules is backend-dependent
- Evidence privacy and encryption are backend responsibilities
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected
- Color is not the only indicator of state

## Current Implementation Status

- **Partial**: Safety center, reports, blocked users, and trusted contacts screens are UI-complete. Backend enforcement of blocking, report resolution, and emergency escalation are pending.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/safety` with reports, blocked users, trusted contacts, and Flyway migration V11.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.
- Fallback cleanup: deleted `safetyFallbacks.ts` and removed inline fallbacks from `SafetyCenterScreen`, `BlockedUsersScreen`, `ReportsScreen`, and `TrustedContactsScreen` in favor of live backend endpoints, loading states, and error/empty states.
