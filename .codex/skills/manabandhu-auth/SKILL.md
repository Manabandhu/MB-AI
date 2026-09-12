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
- **Stitch Design Alignment**: Updated `SignInScreen` to match Stitch screen `6df7f7673dd942b69ae807cc2220213b` (top bar with verified emblem badge, floating labeled inputs with mail/lock icons, password visibility toggle, remember device checkbox, Phone OTP & Magic Link options, and Supabase 256-bit encryption badge). Updated `SignUpScreen` to match Stitch screen `8599b392d0834ce1af1e7c0becb776e1` (verified member badge, live 4-bar password strength meter, community safety banner, and quick auth options).
- **Auth Suite & Website Designs**: Added `AuthPageLayout` providing a responsive 2-column split-screen layout on desktop web (branded showcase with community pillars, testimonials, trust stats) and fluid mobile view. Added `signInWithOAuth` supporting Apple and Google social sign-in. Upgraded all auth screens to use exact vector icons from `AppIcon` (`mail`, `lock`, `phone`, `eye`, `check`, `shield`, `warning`), official original 4-color Google and solid Apple SVG icons, directly integrated Gluestack `Input`/`InputField` and `AppButton`, and implemented an interactive country code dropdown selector modal for `PhoneLoginScreen` (+1 US/CA, +91 IN, +44 UK, +61 AU, +971 UAE, +65 SG, +49 DE, +353 IE). Magic link was removed per design guidance.
- **Brand Refinement**: Broadened community messaging to the wider Desi community across all auth flows; completely removed all mentions of "brokerage" in favor of direct community listings; removed the green verified checkmark beside the "ManaBandhu" title in auth showcase headers.



