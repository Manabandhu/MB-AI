# Safety

Owns the safety center, user reports, blocked users, trusted contacts, emergency escalation, evidence privacy, and moderation status.

## Component Inventory

- `SafetyCenterScreen` - catalog screen using `FeatureScreen`
- `ReportsScreen` - list screen with filter chips, status badges, and `SectionHeader`
- `BlockedUsersScreen` - list screen with avatars, `SwipeAction`, and `SectionHeader`
- `TrustedContactsScreen` - list screen with avatars, add action, and `SectionHeader`

## API

- `GET /api/v1/safety/center` - returns `CatalogScreenContent`
- `GET /api/v1/safety/reports` - returns `ReportItem[]`
- `GET /api/v1/safety/blocked-users` - returns `BlockedUserItem[]`
- `GET /api/v1/safety/trusted-contacts` - returns `TrustedContactItem[]`

## Routes

- `/safety` - `SafetyCenterScreen`
- `/safety/reports` - `ReportsScreen`
- `/safety/blocked-users` - `BlockedUsersScreen`
- `/safety/trusted-contacts` - `TrustedContactsScreen`
