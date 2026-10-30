# Safety

Owns the safety center, user reports, blocked users, trusted contacts, emergency escalation, evidence privacy, and moderation status.

## Component Inventory

- `SafetyCenterScreen` - Call 911/988, the member's own counts, tool links, true trust statements only.
- `ReportsScreen` - your reports (All/Open/Closed), "File a report" about someone you chat with.
- `BlockedUsersScreen` - blocked members; Unblock asks first.
- `TrustedContactsScreen` - add contacts (name + phone or email); call or email them. No edit/remove endpoint yet.
- `components/ReportSheet` - files `POST /safety/reports`; exported from `index.ts` (used by chat).
- `safetyFormat.ts` - report reasons/categories/status, trusted-contact validation, `telHref`.

## API

- `GET|POST /api/v1/safety/reports`
- `GET /api/v1/safety/blocked-users`, `POST /api/v1/safety/blocked-users/{id}/unblock`
- `GET|POST /api/v1/safety/trusted-contacts`

## Routes (all require sign-in)

- `/safety` - `SafetyCenterScreen`
- `/safety/reports` - `ReportsScreen`
- `/safety/blocked-users` - `BlockedUsersScreen`
- `/safety/trusted-contacts` - `TrustedContactsScreen`
