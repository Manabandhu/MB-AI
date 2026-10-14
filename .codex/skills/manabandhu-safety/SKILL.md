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

- `SafetyCenterScreen` - `Screen`/`ScreenHeader`; emergency card (Call 911 / Call 988, 52pt `AppButton`s via `Linking`, errors through `showError`), pulsing halo that is static under reduced motion, the caller's own counts, tool `Card`s, and only true trust statements
- `ReportsScreen` - your reports with `SegmentedControl` (All/Open/Closed with counts), `StatusBadge` via `reportStatus`, readable `reportCategoryLabel`; "File a report" picks a person from your chats (`useChatContacts` from `@/modules/chat`) and opens `ReportSheet`
- `BlockedUsersScreen` - `PersonRow` list; "Unblock" asks with a red `useConfirm`
- `TrustedContactsScreen` - `PersonRow` list with Call (`tel:`) and email (`mailto:`) buttons; "Add" `BottomSheet` (name + phone or email, validated by `trustedContactErrors`). No edit/remove: the backend has no endpoints
- `components/ReportSheet` (exported from `safety/index.ts`) - reason and severity radio chips, details (min 10 chars), `POST /api/v1/safety/reports`; closes and confirms only after the server stored it. Used by chat's conversation info
- Pure helpers: `safety/safetyFormat.ts` (`REPORT_REASONS`, `reportCategory`, `reportCategoryLabel`, `reportStatus`, `trustedContactErrors`, `telHref`), tested in `frontend/test/safetyUtilities.test.mjs`

## API Surface

- `getReports()` -> `GET /api/v1/safety/reports`; `createReport({ targetId, category, description, severity })` -> `POST /api/v1/safety/reports` (category is `<target>:<reason>`, e.g. `user:harassment`, `conversation:spam`)
- `getBlockedUsers()` -> `GET /api/v1/safety/blocked-users`; `unblockUser(id)` -> `POST /blocked-users/{id}/unblock`
- `getTrustedContacts()` -> `GET /api/v1/safety/trusted-contacts`; `createTrustedContact(input)` -> `POST /api/v1/safety/trusted-contacts`

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: `LoadingState` while safety data loads
- **Empty**: `EmptyState` when no reports, blocked users, or contacts exist
- **Error**: `ErrorState` with retry action
- **Success**: confirmation after block/unblock or contact add
- **Offline**: none; failures show `ErrorState` or an inline alert
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Safety center actions: Reports, Blocked users, Trusted contacts
- Back navigation to safety center from all sub-screens
- Cross-module: chat conversation info opens `ReportSheet`; blocking is NOT yet enforced by other modules' backends, so the UI must not claim that blocked members cannot contact you

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/safety*` are thin wrappers and all call `useRequireAuth('/sign-in')` (including `app/safety.tsx`)
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
- Safety Center Stitch overhaul: modernized `SafetyCenterScreen.tsx` with premium community safety shield UI, emergency SOS quick action bar (one-touch 911 and 988 crisis line), safety tools navigation cards (Trusted Contacts, Safety Reports, Blocked Members), community verification standards, and dynamic metrics; added resilient `DEFAULT_SAFETY_DATA` fallback and `isCompact` adaptations for narrow foldable cover screens.
- Animated Emergency SOS beacon: upgraded `SafetyCenterScreen.tsx` with continuous animated pulsing halo beacon surrounding the SOS emergency shield icon, and aligned all color tokens to the canonical design system (`#431ebe`, `#00696b`, `#ff7e33`). Matching Stitch screen: `55e09dfa95914dafa492fdf142b9c7cf`.
- Repo-Wide Code Review & Defect Remediation: Audited touch target sizing and `hitSlop` across emergency actions, verified loading and error states, and ensured safety reports lifecycle compliance.
- Platform Compatibility: Updated `SafetyCenterScreen.tsx` pulse beacon animation with `useNativeDriver: Platform.OS !== 'web'` to ensure silent execution across React Native Web and native platforms without runtime driver warnings.
- Security & correctness hardening (2026-10): Only `GET /api/v1/safety/center` is public; reports, blocked users and trusted contacts require a JWT (previously the `/api/v1/safety/**` wildcard made them reachable anonymously and they failed with 500). Removed the unreachable `SafetyGraphqlController`, which let any user resolve any report. Report resolution is audited when done from the admin console.
- No invented numbers (2026-10): removed `DEFAULT_SAFETY_DATA`. `SafetyCenterScreen` counts come from the caller's own lists: open reports = `GET /api/v1/safety/reports` with status `OPEN` or `IN_REVIEW` (`isOpenReport`), blocked users = length of `GET /blocked-users`, trusted contacts = length of `GET /trusted-contacts`; loading/error states replace the metrics. `safety/api.ts` types now mirror the backend entities (`SafetyReport`: `category`, `description`, uppercase `status`, `severity`, `createdAt`; `BlockedUser`: `blockedUserId`, `reason`, `createdAt`; `TrustedContact`: `relationship`, `createdAt`) and add `unblockUser` (`POST /blocked-users/{blockedUserId}/unblock`). `BlockedUsersScreen` unblocks for real and labels users `Member XXXX`; no-op "New report"/"Add contact" actions were removed. Emergency 911/988 and trust-standard copy remain static guidance.
- Screen metrics are computed from the database (2026-10): `SafetyContentService.center(Optional<Actor>)` counts the caller's open reports (`OPEN`/`IN_REVIEW`), blocked users and trusted contacts with repository `count…` queries; anonymous viewers of the public `/center` route get an empty `metrics` list.
- Trust copy (2026-10): the Safety Center no longer claims hosts/drivers/referrers pass ID verification; it states that posting requires a signed-in member and anyone can be reported or blocked.
- Cleanup: removed unused API exports; content service uses `CatalogContent`.
- Public API: `safety/index.ts` exports `moduleMeta` (launcher entry).
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 fix (2026-10-10): reporters can no longer resolve their own reports. `SafetyReportService.resolve(Actor, id)` and `findAllForAdmin(Actor)` require an admin in the service (REST `/safety/reports/{id}/resolve` and admin `/admin/reports/{id}/resolve` share it); the moderation queue is capped at the newest 500.
- Shared primitives (2026-10-11): `ReportsScreen` shows report status with the shared `StatusBadge` (the legacy `shared/components/Badge` was deleted).
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['report', 'block', 'trusted contacts', 'emergency', 'sos', 'harassment', 'scam']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- P0/P1 pass (2026-10-13): removed false claims ("share with one tap", "accounts are banned", "blocked users cannot contact you"); trusted contacts can be added and called/emailed; unblock confirms; reports can be filed (`ReportSheet`) from Reports and from chat; pulse respects reduced motion; SOS buttons are 52pt. All four screens on shared primitives with no hex or `StyleSheet`.
