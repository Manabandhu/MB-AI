---
name: manabandhu-auth
description: Maintain ManaBandhu authentication, registration, sessions, account recovery, identity verification, authorization-aware navigation, and Supabase Auth integration. Use for changes under the frontend auth module or shared identity behavior.
---

# Authentication

## Module Purpose and Ownership

Owns Sign In, Sign Up, Forgot Password, phone/email login, OTP verification, reset password, choose login method, session lifecycle, account recovery, identity verification, authorization-aware navigation, and Supabase Auth adapters.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/sign-in` | `SignInScreen` | auth | normal, error, loading, needs-confirmation |
| `/sign-up` | `SignUpScreen` | auth | normal, error, loading, needs-confirmation |
| `/forgot-password` | `ForgotPasswordScreen` | auth | normal, success, error |
| `/otp-verification` | `OtpVerificationScreen` | auth | normal, error, loading |
| `/reset-password` | `ResetPasswordScreen` | auth | normal, success, error |
| `/auth/callback` | `AuthCallbackScreen` | auth | confirming, error |

## Component Inventory

- `SignInScreen` - email/password sign-in with zod client validation
- `SignUpScreen` - account creation form with zod client validation
- `ForgotPasswordScreen` - password reset initiation
- `OtpVerificationScreen` - OTP entry with countdown
- `ResetPasswordScreen` - new password form
- `AuthCallbackScreen` - email confirmation / OAuth callback handler

## API Surface

- Supabase Auth client in `frontend/src/lib/supabase.ts`
- Identity fetched from `GET /api/v1/me` (backend-derived, not client-supplied)
- No demo sign-in path; production auth is Supabase-backed end-to-end

## Demo Fixtures

- `frontend/src/modules/auth/fixtures.ts` - `authCredentialsFixture` and `authFlowsFixture`

## State Patterns

- **Loading**: spinner while auth action is in flight
- **Empty**: not applicable
- **Error**: inline error message with retry
- **Success**: auto-navigate to `/home` (or `/auth/callback` for confirmation)
- **Waiting**: needs-email-confirmation state shows "check your email" prompt
- **Offline**: disable submit, show offline banner
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- `/sign-in` -> `/home` on success, `/forgot-password`
- `/sign-up` -> show confirmation prompt, `/sign-in` (or `/auth/callback` after email confirmation clicks through)
- `/forgot-password` -> `/sign-in`
- `/otp-verification` -> `/home` on success
- `/reset-password` -> `/home` on success
- `/auth/callback` -> redirect target after confirmation (typically `/home` via onAuthStateChange)

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/` delegate to dedicated auth screens
- Native sessions stored with Secure Store; browser persistence on web
- `frontend/src/lib/supabase.ts` owns shared Supabase client with static-render WebSocket fallback for Node runtimes
- Forms use `react-hook-form` + `zod` + `@hookform/resolvers`
- Never log tokens or place service credentials in the client

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All inputs have `accessibilityLabel`
- Focus ring width: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Support screen readers for all content

## Current Implementation Status

- **Done (Day 01)**: Email/password sign-up with required email verification; email confirmation callback via `/auth/callback`; real email/password sign-in; identity endpoint `GET /api/v1/me` integrated; session lifecycle with startup hydration, restoration, `onAuthStateChange` listener, and sign-out; protected navigation via `useRequireAuth` / `useRedirectIfAuthenticated`; zod client-side validation on sign-in and sign-up forms; demo sign-in path removed.
- **Recent Auth Verification**: Verified end-to-end live Supabase Auth and Spring Boot token validation (`GET /api/v1/me`). Updated `SignUpScreen` to subscribe to `storeError` from `useAuthStore` so that Supabase authentication errors and rate limit feedback are rendered inline. Tested sign-in flow with confirmed Supabase account (`rajesh@manabandhu.com`), successfully hydrating user session and navigating to `/home`.
- **Pending**: Phone OTP, email magic link (non-OTP), Google, and Apple providers remain explicitly unverified.
