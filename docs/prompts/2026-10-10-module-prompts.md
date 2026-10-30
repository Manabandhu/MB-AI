# ManaBandhu prompt pack — end-to-end review, 2026-10-10

One prompt per module, from a full review of every screen, module api, backend service and workflow on
`claude/loving-wright-3a3bah` (synced with origin). Paste **one prompt per new session**, in order. Every prompt is
self-contained: it pulls from origin first, re-checks each finding (line numbers drift), fixes, tests, updates the
module skill and docs, then commits and pushes.

Baseline at review time: `verify:routes` 123 calls / 245 routes OK, `verify:screens` 121 routes OK, design ratchet
1,292 legacy colour violations in 52 files. Earlier review: `docs/reviews/2026-10-09-end-to-end-security-review.md`.

P0 = security, data leaks, or a core flow that is broken today. Run prompts 0–2 first: later prompts depend on them.

| # | Module | Priority | Depends on |
|---|---|---|---|
| 0 | [P0 security & data-leak hotfixes (cross-module)](#0-p0-security--data-leak-hotfixes-cross-module) | P0 | — |
| 1 | [Shared media uploads](#1-shared-media-uploads) | P1 | — |
| 2 | [Notifications platform](#2-notifications-platform) | P1 | — |
| 3 | [Auth + legal/compliance](#3-auth--legalcompliance) | P0 | 0 |
| 4 | [Onboarding](#4-onboarding) | P1 | 1, 2 |
| 5 | [App shell: Home, Explore, Search, Saved, Profile, Settings](#5-app-shell-home-explore-search-saved-profile-settings) | P1 | 0 |
| 6 | [Rooms](#6-rooms) | P1 | 0, 1 |
| 7 | [Rides](#7-rides) | P1 | 0, 2 |
| 8 | [Chat](#8-chat) | P1 | 1, 2 |
| 9 | [Community](#9-community) | P1 | 1 |
| 10 | [Events](#10-events) | P1 | 0 |
| 11 | [Expenses](#11-expenses) | P1 | 0 |
| 12 | [Jobs](#12-jobs) | P0 | 0 |
| 13 | [Marketplace](#13-marketplace) | P1 | 1, 8 |
| 14 | [Referrals](#14-referrals) | P0 | 8 |
| 15 | [Immigration](#15-immigration) | P1 | 0 |
| 16 | [Utilities](#16-utilities) | P0 | 0 |
| 17 | [Safety](#17-safety) | P1 | 8 |
| 18 | [Admin / super-admin](#18-admin--super-admin) | P1 | 0 |
| 19 | [AI assistant](#19-ai-assistant) | P2 | 0 |
| 20 | [Design system, accessibility, i18n, responsive](#20-design-system-accessibility-i18n-responsive) | P2 | 0 |
| 21 | [Analytics & observability](#21-analytics--observability) | P2 | 0 |
| 22 | [Deployments & CI](#22-deployments--ci) | P1 | — |
| 23 | [Tests & docs sync](#23-tests--docs-sync) | P2 | 0 |

---

## 0. P0 security & data-leak hotfixes (cross-module)

Skills: manabandhu-backend-api, manabandhu-immigration, manabandhu-referrals, manabandhu-rides, manabandhu-rooms, manabandhu-events, manabandhu-expenses

````text
Task: P0 security & data-leak hotfixes (cross-module) — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-backend-api, manabandhu-immigration, manabandhu-referrals, manabandhu-rides, manabandhu-rooms, manabandhu-events, manabandhu-expenses

Findings to fix (from the 2026-10-10 review):
- Immigration: `SecurityConfig` makes `/api/v1/immigration/**` public and `GET /immigration/checklists` returns every
  user's personal checklists (`ImmigrationController` ~L72, `ImmigrationChecklistService.findAll`). Replace the
  wildcard with exact public paths for published content only; checklists → caller-owned, authenticated.
- Referrals: `GET /referrals/{id}/request` and `/{id}/offer` (`ReferralController` ~L75-95) have no visibility check.
- Rides: women-only `genderPreference` not enforced at booking (`RideBookingService.create`); seat-request accept
  (`RideRequestService` ~L73-85) has no lock/seat check/decrement/participant creation.
- Rooms: owner can set `isVerifiedHost` (`CreateRoomListingInput`, `UpdateRoomListingInput`, `RoomListingService`
  ~L101/126) — server-only. GraphQL `savedRoomListings` returns status-"saved" listings for anyone; GraphQL
  `createRoomListing` skips draft + validation.
- Events: `EventsService` ~L44 "saved" = status "saved" for all users, no auth.
- Expenses: debtor can record a "completed" settlement alone (`SettlementService` ~L44-62); `settledAt` from client;
  `updateStatus` has no transitions/lock.
- Safety/Admin: reporters can resolve own reports; `SafetyReportService.resolve`, `AdminDirectoryService.setStatus`
  check nobody (controller-only); admin can suspend self/super-admin; `ADMIN_PUBLIC_ACCESS_ENABLED` must be impossible
  in prod; admin reading private chats must write `admin_audit_log`.
- Jobs: applicant can set own application to "accepted" (`JobsController` ~L162); duplicate/closed-job applications.
- Invalid enum/date inputs → 500 (`ImmigrationController` ~L52 `valueOf`, `UtilitiesController` ~L48,
  `EventsController` ~L72 `Instant.parse`) → return 400.
Acceptance: denied-path unit test per item + authz-smoke checks; no behaviour change for legitimate users.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 1. Shared media uploads

Skills: manabandhu-backend-api, manabandhu-architecture, manabandhu-mobile-platform

````text
Task: Shared media uploads — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-backend-api, manabandhu-architecture, manabandhu-mobile-platform

Findings to fix (from the 2026-10-10 review):
Nothing uploads images: rooms (`RoomForm.tsx` ~L158/261), marketplace (`SellItemScreen.tsx` ~L188), community
(`imageUrl` is a local file URI), chat (sends `file://` path as body, `ConversationScreen.tsx` ~L154), onboarding
(stock Unsplash avatar, `OnboardingScreen.tsx` ~L646). Build one upload path using the existing backend `media`
package (signed upload to Supabase Storage via backend, size/type limits, owner-scoped keys, delete), a shared
frontend `useImageUpload` hook with progress/error, and validate image URLs server-side (reject arbitrary URLs in
`AddListingImageInput`). Wire module screens in their own prompts; here deliver the platform + one consumer (avatar).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 2. Notifications platform

Skills: manabandhu-notifications

````text
Task: Notifications platform — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-notifications

Findings to fix (from the 2026-10-10 review):
- Nothing produces notifications (`NotificationService.create` only from admin POST). Add an internal
  `NotificationPublisher` service other modules call (ride request/accept, room inquiry, chat message, expense added,
  referral response, event RSVP); respect user preferences in `NotificationDispatcherService`.
- Push: add expo-notifications token registration + backend device-token endpoint/table (RLS), OS permission prompt in
  onboarding notifications step and settings.
- Fake success: `quietHours` toggle (`NotificationSettingsScreen.tsx` ~L165/522) is dropped by backend allowed keys
  (`NotificationsContentService` ~L19-29) yet shows "saved" — implement for real or remove. Merge the two preference
  stores (`notification_settings` vs `NotificationPreference`).
- Inbox: show error state (`NotificationsInboxScreen.tsx` ~L66 ignores `isError`), mark-all-read, swipe actions,
  unread badge from `/unread-count`, use `POST /{id}/read` instead of GET side-effect, invalidate inbox cache, detail
  "Open" button to `route`, server-side paging (`NotificationService` ~L23 loads all). `useRequireAuth` on settings.
- Split `NotificationSettingsScreen.tsx` (908 lines), tokenise colours; update stale MODULE.md "Placeholder" text.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 3. Auth + legal/compliance

Skills: manabandhu-auth, manabandhu-foundation

````text
Task: Auth + legal/compliance — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-auth, manabandhu-foundation

Findings to fix (from the 2026-10-10 review):
- `ResetPasswordScreen.tsx` ~L33 ignores `setSession` result → show expired-link error immediately.
- Sign-out double navigation (`SettingsScreen.tsx` ~L35 + `authStore.ts` ~L313); `ProfileTab.tsx` ~L105 ignores errors.
- Splash double session check (`_layout.tsx` ~L42 + `SplashScreen.tsx` ~L22) and 2.2s fallback can bounce signed-in
  users to welcome.
- Add Terms of Service + Privacy Policy screens/routes (and web URLs for store listings); link + consent checkbox on
  `SignUpScreen.tsx` ~L181.
- Account deletion (App Store/Play requirement): backend endpoint that deletes/anonymises user data across modules +
  Supabase auth user, confirm flow with re-auth; data export (JSON) endpoint.
- Change email/phone, re-auth before sensitive actions; document Supabase redirect URLs/providers setup.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 4. Onboarding

Skills: manabandhu-foundation, manabandhu-auth

````text
Task: Onboarding — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-foundation, manabandhu-auth

Findings to fix (from the 2026-10-10 review):
- Replace demo avatar (`OnboardingScreen.tsx` ~L646-654, saved ~L268) with real upload (prompt 1).
- `onboardingApi.ts` ~L78/145/200/270 silently falls back to direct Supabase writes on any non-OK (incl. 400/401) —
  only fall back on network failure or remove; surface errors.
- Guest completion lands on `/home` and loses answers (~L248) — route to sign-up preserving answers.
- Notifications step: write to real notification settings + ask OS permission (prompt 2).
- Split the 1,482-line file into one component per step; a11y labels; progress persistence.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 5. App shell: Home, Explore, Search, Saved, Profile, Settings

Skills: manabandhu-foundation, manabandhu-design-system

````text
Task: App shell: Home, Explore, Search, Saved, Profile, Settings — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-foundation, manabandhu-design-system

Findings to fix (from the 2026-10-10 review):
- Search (`SearchScreen.tsx`): client filters first page of 4 lists; "Rides" category has no query (~L44); hard-coded
  Austin "popular searches" (~L50). Add a backend unified search endpoint (paged, per-module) and use it; recent
  searches per user.
- Saved: include jobs, marketplace, immigration, events; pull-to-refresh; a11y labels.
- Settings: "Replay Welcome" → `/splash` bounces home (~L202); copy promises SMS/email/quiet hours that don't exist
  (~L190). Profile: add edit-profile (name, avatar, city, languages) backed by API.
- Remove/use unused `GET /foundation/welcome`; split `SearchScreen.tsx` (573).
- Easy-access UI: global quick-actions, consistent back/close, deep-link fallbacks per NAVIGATION_MAP §4, offline
  banner per §9 (no screen has offline handling today).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 6. Rooms

Skills: manabandhu-rooms

````text
Task: Rooms — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-rooms

Findings to fix (from the 2026-10-10 review):
- Status casing bug: `RoomMyListingsScreen.tsx` ~L75/97 + `types.ts` ~L18 compare `ACTIVE`/`DRAFT` vs lowercase →
  tabs empty, pause impossible. Delete lacks `onError` (~L90).
- Fake data: `DEFAULT_ROOM_PHOTOS` on every room (`RoomDetailScreen.tsx` ~L49-102); hard-coded "Patel Brothers"
  nearby text (~L539); "Recommended" sort claims reviews but returns 0 (`RoomsScreen.tsx` ~L182/622).
- Saved store swallows errors (`savedRoomsStore.ts` ~L36-75, never prunes); `api.ts` ~L108/116 turns 401/403 into
  empty. "Chat" button sends invented inquiry answers (`RoomDetailScreen.tsx` ~L192).
- Backend: `size=500` client filtering (`api.ts` ~L35) → server filters + paging; inquiry logic in controller
  (`RoomsController` ~L289-332) → transactional service, dedupe conversation, rate limit; `isAdmin` booleans → Actor;
  row locks on status/booking changes.
- Wire photo upload (prompt 1). Add UI for report listing, saved searches, availability/booking if in scope.
- Split `RoomsScreen.tsx` (3,719 lines, 143 colour violations) into list/map/filter components; `useRequireAuth` on
  create-listing route; add `/rooms/[roomId]/inquiry` to docs; fix stale MODULE.md.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 7. Rides

Skills: manabandhu-rides

````text
Task: Rides — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-rides

Findings to fix (from the 2026-10-10 review):
- Casing: `RideManageScreen.tsx` ~L130/301 `=== 'ACTIVE'`. "Deactivate" sends CANCELLED but says "paused".
- Fake data: `RideDetailScreen.tsx` always "Active"/`?? 2` seats (~L323/243), 4-seat picker with invented "Verified
  Passenger" (~L571-690); `api.ts` ~L208 participants always CONFIRMED; ratings averaged then shown as 3 identical
  scores (~L216/265); 3 hard-coded Texas cities (`RidesScreen.tsx` ~L78) that don't filter.
- Riders can't create seat requests (UI never calls `POST /offers/{id}/requests`); accept/reject no `onError`
  (`RideSeatRequestsScreen.tsx` ~L24/30).
- `/mine` and `/history` identical driver-only (`RidesController` ~L258) — add passenger rides.
- Offer status transitions + lock (`RideOfferService` ~L139); cancelling a ride cancels/notifies bookings; request
  create validates departure/seats; GraphQL `createRideOffer` reuses service validation; page all lists; debounce
  search (~L233), load-more.
- Split `RidesScreen.tsx` (2,292) and `RideDetailScreen.tsx` (1,705); tokenise ~160 hex colours.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 8. Chat

Skills: manabandhu-chat, manabandhu-safety

````text
Task: Chat — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-chat, manabandhu-safety

Findings to fix (from the 2026-10-10 review):
- Fake success in `ConversationInfoScreen.tsx`: mute (~L57), leave (~L67), report (~L81, invented "2 hours"). Add
  endpoints (leave via existing `ConversationParticipantService.leave`, mute per participant, report → safety).
- Realtime messages marked `sent: true` (`useRealtimeChat.ts` ~L57) so others' messages render as mine
  (`ConversationScreen.tsx` ~L278). Failed sends stay as sent; "Offline" flag never cleared (~L108).
- Images send local path (~L154) → upload (prompt 1). Remove invented "self-delete 2 hours after trip" (~L241).
- New chat can't start a chat: add people search + `POST /conversations` UI.
- Backend never fills `participants`, `name`, `unreadCount` → populate; page conversation list, fix N+1 last-message
  lookup (`ConversationService` ~L30), "load older" messages, throttle typing events, realtime list updates.
- Enforce blocks (`BlockedUserService.isBlocked` unused) in conversation create/send. Update stale skill text.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 9. Community

Skills: manabandhu-community

````text
Task: Community — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-community

Findings to fix (from the 2026-10-10 review):
- Broken link `/community/post/${id}` vs `/community/posts/[postId]` (`CommunityDetailsScreen.tsx` ~L129).
- `CreatePostScreen.tsx` ~L92 falls back to `'c1'`; tab opens create without community → add community picker.
  Title prefix can exceed 120; body limit 2,000 vs backend 4,000.
- Fake data in `PostDetailsScreen.tsx`: reaction counts 84/129/42 (~L43), share says copied (~L143), save local
  (~L151), everyone verified (~L170), dead Reply/Top Answers (~L235/248); hard-coded tags (`CreatePostScreen` ~L48);
  comment errors shown as empty (`api.ts` ~L304).
- Contract: backend `CommunityPost` lacks `authorName/commentCount/likeCount/tags/imageUrl`; add DTO; support
  un-react (DELETE), threaded replies (`parentId`), reaction type enum + unique constraint.
- Service checks: community exists + membership on post; post exists on comment/reaction; paging everywhere.
- Discover/Joined cards tappable + Join/Leave buttons; edit/delete own post/comment; report post; images.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 10. Events

Skills: manabandhu-events

````text
Task: Events — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-events

Findings to fix (from the 2026-10-10 review):
- Saved events: add per-user save endpoint/table (RLS) + UI save button; fix `EventsService` saved query.
- `CreateEventScreen.tsx`: `categoryId` required by backend (~L79) → picker; `endAt = startAt` (~L76); UTC/local date
  shift (~L47/72); real date/time picker, past-date validation; virtual event URL field.
- RSVP status enum; cancel RSVP/interested; organizer edit/delete/guest list; `/mine` includes registered events (or
  fix copy `MyEventsScreen.tsx` ~L51); search copy says category (~L65) — implement or fix; entry point to search.
- Upcoming filter server-side; page `/mine`, `/saved`, GraphQL `events`; a11y on RSVP/Directions
  (`EventDetailsScreen.tsx` ~L217/254); add-to-calendar + share.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 11. Expenses

Skills: manabandhu-expenses

````text
Task: Expenses — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-expenses

Findings to fix (from the 2026-10-10 review):
- No member management: wire `GET/POST/DELETE /groups/{id}/members` (invite by user search/link).
- Settlements: two-party confirmation (pending → confirmed by creditor), transitions under lock, server `settledAt`
  (coordinate with prompt 0 if done).
- `ExpenseService.create` ignores EXACT/PERCENTAGE splits → implement with validation; expense edit/delete; group
  edit/delete; group balances + splits UI.
- `AddExpenseScreen.tsx` ~L58 silently picks first group → require choice. Currency hard-coded "$"
  (`BalancesScreen.tsx` ~L42/130, `AddExpenseScreen.tsx` ~L219) → group currency.
- N+1 in `ExpenseGroupService.view`; page lists; tokenise colours in `ExpensesHomeScreen.tsx` ~L588-779; stale skill.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 12. Jobs

Skills: manabandhu-jobs

````text
Task: Jobs — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-jobs

Findings to fix (from the 2026-10-10 review):
- Posting always fails: `PostJobScreen.tsx` ~L52 omits required `categoryId`; `control.register()` on native
  TextFields (~L78-88) → use `Controller`. Add category, employment type, salary, remote, apply URL fields.
- `/jobs/search` and `/jobs/saved` render home (`JobsHomeScreen.tsx` ~L75 ignores screenId); saved only in state →
  add favorites endpoint/table; visa + Hybrid filters not applied (~L144-193, 498-529); `JobsFiltersScreen` Apply
  passes nothing; city picker always Austin coords (~L93); only first 50 fetched → server filter + paging.
- "Request Referral" card button (~L460) → link to referrals with job prefilled.
- Move authz into services; apply-in-app, my postings/applications, edit/close/delete, report. Add backend tests (none).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 13. Marketplace

Skills: manabandhu-marketplace

````text
Task: Marketplace — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-marketplace

Findings to fix (from the 2026-10-10 review):
- "Chat with Seller" opens `/chat/new` with no seller (`ListingDetailsScreen.tsx` ~L339) and shows to owner → start
  conversation with seller about listing (needs chat prompt).
- Photo upload (prompt 1); no paging (`api.ts` ~L9) and saved/search/categories filter page 1 client-side
  (`MarketplaceHomeScreen.tsx` ~L120); categories/images return `[]` on error (`api.ts` ~L26-45).
- Edit/delete/mark-sold UI (backend exists), report listing, seller profile (shows "Community member").
- Authz into services; `ListingImageService.delete` existence check; backend tests (none); frontend never calls
  `/marketplace/screens/{id}` → remove or use; fix MODULE.md.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 14. Referrals

Skills: manabandhu-referrals

````text
Task: Referrals — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-referrals

Findings to fix (from the 2026-10-10 review):
- Fake success: "Request Introduction" (`ReferralDetailsScreen.tsx` ~L112-120, ~L433) sends nothing → real endpoint.
- `RequestReferralScreen.tsx` ~L44 sends undefined `category` (backend `@NotBlank`) → picker; resolve SKILL.md
  contradiction (~L87).
- Bookmark local-only (~L151); "Message" opens `/chat` with no recipient (~L392); `api.ts` ~L79-99 errors → null.
- UI for `PATCH /{id}/status` (close/withdraw); page `GET /referrals` and public top-100.
- Tokenise `ReferralsHomeScreen` (98) / `ReferralDetailsScreen` (90) colour violations; backend tests (none).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 15. Immigration

Skills: manabandhu-immigration

````text
Task: Immigration — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-immigration

Findings to fix (from the 2026-10-10 review):
- (Security fix in prompt 0.) Legal disclaimer on every screen (SKILL.md requires it); show verified flag on
  `ResourceDetailScreen`.
- URL scheme allowlist (https only) on `CreateImmigrationResourceInput` and before `Linking.openURL`
  (`ImmigrationHomeScreen.tsx` ~L70).
- `/questions` reuses FAQ (~L112) → real ask/answer; `/saved` placeholder (~L465) → saved resources; guide detail
  screen; checklist progress tracking (per-user items).
- Wrong CTA routes in `ImmigrationContentService` ~L76/104/112; page lists; unused `/screens/{id}`.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 16. Utilities

Skills: manabandhu-utilities

````text
Task: Utilities — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-utilities

Findings to fix (from the 2026-10-10 review):
- Frontend types (`utilities/api.ts` ~L20-42: title/body/meta) don't match backend entities (trackingNumber/carrier,
  name/address/phone/distanceKm, hours) → cards empty, search crashes (`PackageTrackingScreen.tsx` ~L26,
  `NearbyScreen.tsx` ~L26). Define DTOs + contract.
- Nearby: fake search box (`Text`, ~L72), filter toggles fake permission (~L83), no real location → use device
  location + server distance query, permission banner per NAVIGATION_MAP §8.
- Packages: add-package form, carrier tracking links, `useRequireAuth` on route.
- Emergency: `tel:` tap-to-call, correct empty copy (~L66), 911 always visible.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 17. Safety

Skills: manabandhu-safety

````text
Task: Safety — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-safety

Findings to fix (from the 2026-10-10 review):
- No UI to report, block, or manage trusted contacts; backend lacks DELETE contact. Add "Report"/"Block" entry points
  on profiles, chat, listings, posts (shared `ReportSheet`).
- Block self / nonexistent user prevented; enforce blocks in chat, rides, rooms inquiries, community.
- SOS: share live trip/location with trusted contacts (ties to rides); evidence attachments.
- `useRequireAuth` on `app/safety.tsx`; pull-to-refresh; tokenise `SafetyCenterScreen.tsx` (522 lines, 25 colours).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 18. Admin / super-admin

Skills: manabandhu-super-admin, manabandhu-admin

````text
Task: Admin / super-admin — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-super-admin, manabandhu-admin

Findings to fix (from the 2026-10-10 review):
- Authz into services (prompt 0); remove/guard `ADMIN_PUBLIC_ACCESS_ENABLED` (`AdminAccessPolicy` ~L18).
- Dead links `/admin/users/{id}`, `/admin/reports/{id}` → add detail screens. Invented values:
  `targetType` "CONTENT"/fake reporter (`AdminReportsController` ~L47); `reported` false + "published"
  (`AdminDirectoryService` ~L83-103); dashboard counts capped at 200 (`AdminDashboardScreen.tsx` ~L76) → real count
  endpoints.
- Moderation actions (hide/remove/restore) for rooms, rides, jobs, events, posts, listings with audit log; page
  `findAllForAdmin`; lowercase user status; client role gate + entry from profile for admins; add
  `/admin/automations` to SCREEN_MANIFEST.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 19. AI assistant

Skills: manabandhu-ai, manabandhu-chat (use claude-api skill)

````text
Task: AI assistant — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-ai, manabandhu-chat (use claude-api skill)

Findings to fix (from the 2026-10-10 review):
- Backend returns canned reply (`AssistantController` ~L50). Integrate Claude via the Anthropic SDK (latest model,
  key from env, timeouts, per-user rate limit, streaming via SSE), grounded on immigration/community content with
  citations; safety/consent notice; no PII logging.
- UI: order messages newest-at-bottom (`AssistantScreen.tsx` ~L41), keep input until send succeeds (~L37), pending/
  typing state, real error vs offline (~L31), empty-state button (~L73), tappable history (`AssistantHistoryScreen`
  ~L65) and citations (`AssistantCitationsScreen` ~L75), new conversation; page messages.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 20. Design system, accessibility, i18n, responsive

Skills: manabandhu-design-system, manabandhu-mobile-platform

````text
Task: Design system, accessibility, i18n, responsive — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-design-system, manabandhu-mobile-platform

Findings to fix (from the 2026-10-10 review):
- Burn down the 1,292 colour/palette violations (rides 289, rooms 251, referrals 188 …) to tokens; extend
  `verify-design-system.mjs` beyond `modules/` and to emoji-as-icon; lower the baseline after each batch.
- i18n: only a few foundation files use `t()` (en.ts 49 lines) — extract strings module by module (en/te/hi).
- a11y sweep: labels/roles/44pt targets, dynamic type, contrast in dark mode.
- Responsive: forms and lists without breakpoints (PostJob, referral forms, utilities) → tablet/desktop grids per
  NAVIGATION_MAP §10; shared skeleton/empty/error/offline components.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 21. Analytics & observability

Skills: manabandhu-analytics, manabandhu-observability

````text
Task: Analytics & observability — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-analytics, manabandhu-observability

Findings to fix (from the 2026-10-10 review):
- Analytics/observability packages are MODULE.md-only. Add frontend event tracking abstraction (privacy-safe, opt-out)
  for key funnels; crash reporting (e.g. Sentry for Expo + Spring); add `micrometer-registry-prometheus` (prometheus
  endpoint is exposed but missing); structured logs with request IDs; alert rules + uptime checks.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 22. Deployments & CI

Skills: manabandhu-deployments

````text
Task: Deployments & CI — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-deployments

Findings to fix (from the 2026-10-10 review):
- `release-mobile.yml` runs unpinned `eas-cli@latest` without `eas.json` → add `eas.json` profiles, pin CLI, OTA
  updates channel, store submit.
- No Dockerfiles; deploy/rollback run opaque secret commands → add backend Dockerfile + documented hosting; web deploy.
- `migrate.yml` uses `ignoreMigrationPatterns='*:missing'` and has no pre-migration backup → add backup step.
- Remove hard-coded default JWKS URL (`application.yml` ~L41). Backup/restore runbook.

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````

## 23. Tests & docs sync

Skills: manabandhu-architecture + touched module skills

````text
Task: Tests & docs sync — fix bugs, make production ready, add the missing features, UI/a11y fixes, and sync code + docs.

First: `git fetch origin && git pull origin <your branch>` and read CLAUDE.md, AGENTS.md, REVIEW.md and the module
skill(s) named below in .codex/skills/ before searching or editing. Re-verify each finding below against current code
(file:line may have drifted; skip anything already fixed). Rules: authorization in services via Actor/RideAccess/
ExpenseAccess (move controller-only checks into services so GraphQL can't bypass), no fake success/invented numbers,
every apiFetch path must match a backend route, lowercase statuses compared case-insensitively, paged/capped lists,
new tables with RLS + revoke, append-only Flyway migrations, OpenAPI + both GraphQL copies kept in sync, theme tokens
instead of hex colours, accessibilityLabel/role on every tappable, loading/empty/error(+retry) states, pull-to-refresh
on lists. Add service tests for every new authz/data rule and checks in scripts/local-dev/authz-smoke.mjs. Update the
module SKILL.md, MODULE.md, NAVIGATION_MAP.md and SCREEN_MANIFEST.md in the same commit. Before handoff: `pnpm verify`,
frontend tests, `cd backend && ./mvnw -q -B test`, `pnpm review:commit`, review diff against REVIEW.md, then commit and
push. Commit in small logical commits.

Module skills to read first: manabandhu-architecture + touched module skills

Findings to fix (from the 2026-10-10 review):
- Backend tests missing for jobs, marketplace, referrals; thin for immigration/utilities. Add service tests.
- Frontend: add API-layer tests and a Playwright E2E smoke (sign-in → each module home → create flow) on phone,
  tablet, desktop widths.
- authz-smoke: add jobs, marketplace, immigration checklists, utilities, events saved, expenses settlements.
- Sync docs: NAVIGATION_MAP lists non-existent `/[id]/details` routes for rooms/rides/community/chat/events/expenses/
  jobs/marketplace/referrals; remove or implement; refresh stale MODULE.md/SKILL.md ("placeholder", "demo
  fallbacks", deleted files).

Finish by reporting what was fixed, what was deferred and why, and the verification output.
````
