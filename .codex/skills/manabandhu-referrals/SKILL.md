---
name: manabandhu-referrals
description: Maintain ManaBandhu referral requests, offers, details, status tracking, consent, privacy, and user-owned referrals. Use for any change under the referrals module or its contracts.
---

# Referrals

## Module Purpose and Ownership

Owns referral discovery, requests, offers, details, status tracking, user-owned referrals, consent, and privacy boundaries.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/referrals` | `ReferralsScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/referrals/request` | `RequestReferralScreen` | form | normal, error, success, loading |
| `/referrals/offer` | `OfferReferralScreen` | form | normal, error, success, loading |
| `/referrals/[referralId]` | `ReferralDetailsScreen` | detail | loading, error |
| `/referrals/mine` | `MyReferralsScreen` | list | loading, empty, error |

## Component Inventory

- `ReferralsScreen` - multi-mode catalog/list screen driven by `screenId` prop
- `RequestReferralScreen` - form to request a referral
- `OfferReferralScreen` - form to offer a referral
- `ReferralDetailsScreen` - referral detail with timeline and actions
- `MyReferralsScreen` - list of my referrals with tabs
- Shared: `FeatureScreen`, `ScreenShell`, `SectionHeader`, `ListScreen`, `Card`, `AppButton`, `DetailScreen`, `Timeline`, `FormScreen`, `Input`, `TextArea`, `Select`, `TabBar`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `listPublicReferrals()` -> `GET /api/v1/referrals/public` (open referrals, `contactInfo` hidden)
- `getMyReferrals()` -> `GET /api/v1/referrals` (JWT, caller's own)
- `getReferralDetail(id)` -> `GET /api/v1/referrals/{id}` (contact info for owner/admin only)
- `getReferralOffer(id)` / `getReferralRequest(id)` -> `GET /api/v1/referrals/{id}/offer|request` (404 -> `null`; other errors throw and show)
- `createReferralRequest(input)` -> `POST /api/v1/referrals` (`title`, `category`, `urgency` low|medium|high required)
- `createReferralOffer(input)` -> `POST /api/v1/referrals/offer` (`title`, `serviceType` required)
- `updateReferralStatus(id, 'open'|'closed')` -> `PATCH /api/v1/referrals/{id}/status` (owner only)
- "Request introduction"/"Offer to help" uses chat: `createConversation(DIRECT)` + `addParticipant(ownerId)` + `sendMessage(pitch)` from `@/modules/chat/api`, then opens `/chat/{id}`.
- Every mutation invalidates the `['referrals']` prefix.

## Demo Fixtures

- Frontend fallbacks removed in favor of backend API endpoints and loading/empty/error states.

## State Patterns

- **Loading**: `LoadingState` while referrals load
- **Empty**: `EmptyState` with action to request or offer referral
- **Error**: `ErrorState` with retry action
- **Success**: navigation on request/offer completion
- **Offline**: offline banner with cached data
- **Permission**: consent required before sharing identity or contact details

## Navigation Actions and Cross-Module Links

- Home actions: Request referral, Offer referral, My referrals
- Request actions: Offer referral, Home
- Offer actions: Request referral, Home
- Details actions: Request referral, My referrals
- Mine actions: Request referral, Offer referral
- Cross-module: deep link from profile and explore

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/referrals/` are thin wrappers
- `ReferralsScreen` uses `useQuery` with backend API data
- `FeatureScreen` provides adaptive catalog/list layout
- Forms use `react-hook-form` + `zod` + `@hookform/resolvers`
- Consent and privacy boundaries are enforced server-side

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Home via `FeatureScreen`, request, offer, details, and my referrals screens are UI-complete. Backend referral lifecycle, consent enforcement, and privacy boundaries are pending.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: rewrote `api.ts` to add missing `getReferralDetail`, `createReferralRequest`, `createReferralOffer`, and `getMyReferrals` functions; aligned `Referral` type with backend entity fields (`ownerId`, `recipientId`, `type`, `status`, `title`, `description`, `createdAt`, `updatedAt`).

- Recent backend changes: created `ReferralsContentService` with `home`, `mine` screen IDs; added `@GetMapping("/screens/{screenId}")` to `ReferralController`.

- Recent fixes: made `category` optional on `createReferralRequest` input and added `serviceType` as a required field on `createReferralOffer` input to match backend `@NotBlank` validation; rewrote `OfferReferralScreen` to use `serviceType`/`availability` state instead of `category`; made `RequestReferralScreen` require a non-empty `category` before submitting.
- Recent urgency fix: `RequestReferralScreen` adds an `urgency` input, validates it as required, and sends `urgency` in the `createReferralRequest` payload; `category` is now optional (`category.trim() || undefined`).
- Stitch screen overhaul: generated mobile Referrals Discovery and Referral Details screens in Stitch MCP (`84e1cfd6b5774d599713132163437272` and `3fd0de404d5f443da6b4c4cdb7e4ce76`). Overhauled `ReferralsHomeScreen.tsx` and `ReferralDetailsScreen.tsx` with rich Desi referral network branding, Telugu badges, search, category filter chips, stats row, segmented Available Offers vs Community Requests tabs, company logos, verified referrer badges, eligibility checklists, what-to-prepare guidance, zero-brokerage pledge, and interactive introduction request modal.
- Backend & security alignment: updated `ReferralService.findAll()` with sorted descending order, updated `ReferralController` to allow guest public reads on `GET /api/v1/referrals` and added `GET /public`, and updated `SecurityConfig` to permit public GET on `/api/v1/referrals` and `/api/v1/referrals/**`. Unblocked public referral details route without forced sign-in redirects.
- Hardcoded data cleanup: removed hardcoded referrer persona ("Phani Teja") and static response rates from `ReferralDetailsScreen` in favor of dynamic referral category and verified member badges; replaced hardcoded stats ticker on `ReferralsHomeScreen` with dynamic counts derived from active offers and requests.
- Repo-Wide Code Review & Defect Remediation: Standardized `api.ts` error handling with `parseJsonOrThrow`, audited `ReferralDetailsScreen.tsx` for route parameter safety, added `hitSlop` on back buttons, and verified loading and empty state lifecycles.
- Security & correctness hardening (2026-10): `GET /api/v1/referrals` requires a JWT and returns the caller's referrals; `GET /api/v1/referrals/public` lists the newest 100 as `ReferralView` with `contactInfo` hidden; `GET /{id}` shows contact info only to the owner/admin. Status changes and attaching offers require ownership. Added `POST /api/v1/referrals/offer`. `recipient_id` is nullable (V31) because creation previously inserted a random UUID that violated the auth.users foreign key. The details screen now renders request details.
- Screen metrics are computed from the database (2026-10): `ReferralsContentService.screen(id, Optional<Actor>)` counts open (`pending|open|active`) request and offer referrals for `home`, and the caller's own requests/offers for `mine` (empty for anonymous viewers).
- Referral details (2026-10): signed-out visitors get a sign-in prompt instead of a 401 "removed" error; removed invented "Verified Referrer", location, reply-time and network labels; status comes from the record.
- Cleanup: removed the unused `index.ts` barrel, `MyReferralsScreen.tsx`, and unused API exports.
- Public API: `referrals/index.ts` exports `moduleMeta` and `ReferralsHomeWidget` (three latest public referrals).
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 visibility fix (2026-10-10): `ReferralService.requireVisible` is the single read rule. Open referrals (`pending|open|active`, compared case-insensitively) are visible to every signed-in member; closed ones only to the owner, the recipient and admins, and read as 404 to everyone else. `GET /{id}`, `GET /{id}/request` and `GET /{id}/offer` all go through it (`ReferralRequestService`/`ReferralOfferService.findForViewer`). `GET /public` lists only open referrals. Status updates require a non-blank value and are stored lowercase.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['referral', 'refer', 'career', 'hiring', 'interview', 'networking']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- Phase 1 correctness pass (2026-10-14): removed the `setTimeout` "Request Sent!" modal; the request now starts a real chat with the poster (pitch of at least 20 characters). Removed the hardcoded eligibility, "what to prepare" checklist, metrics grid, company-logo guessing, local-only bookmark, and the keyword-guessing category chips on the home screen (categories now come from the referrals' own `category`). Owners see Close/Reopen (confirm) instead of request/message. Offer `serviceType` and request `category` are required in the UI (the backend `@NotBlank`), urgency is a segmented control, and both forms open the new referral on success. Home, details and forms use shared primitives (`ScreenHeader` with back, `SegmentedControl`, `ReferralCard`, `ActionBar`, `BottomSheet`); statuses compare case-insensitively (`utils/referralStatus.ts`).
- Review fixes (2026-10-14): contacting a poster is one backend call, `POST /api/v1/referrals/{id}/contact` `{message}` (20–2000 chars) → `{conversationId}`. `ReferralContactService` (one transaction) checks the referral is open (closed reads as 404 for others) and not the caller's own (400), reuses the newest DIRECT chat where exactly the caller and the poster are active participants or creates one, adds both, sends the message, and notifies the poster. `ReferralDetailsScreen` calls `contactReferral` instead of three chat calls. Tests: `ReferralContactServiceTest`; smoke checks in the referrals block.
- Referral contact (2026-10-14): a closed referral returns 404 to every caller, admins included, matching the contract.
