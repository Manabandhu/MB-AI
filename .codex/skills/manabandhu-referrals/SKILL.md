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

- `getReferralsScreen(screenId)` -> `GET /api/v1/referrals/screens/{screenId}`
- `getReferralDetail(referralId)` -> `GET /api/v1/referrals/{referralId}`
- `getMyReferrals()` -> `GET /api/v1/referrals/mine`
- Referral mutation endpoints in `frontend/src/modules/referrals/api.ts` for request, offer, and detail actions.

## Demo Fixtures

- `frontend/src/modules/referrals/referralsFallbacks.ts` - demo fixtures for all referral screens

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
- `ReferralsScreen` uses `useQuery` with fallback data from `referralsFallbacks.ts`
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
