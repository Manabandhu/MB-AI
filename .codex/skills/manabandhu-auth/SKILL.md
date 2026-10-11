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
| `/sign-in` | `SignInScreen` | auth | normal, field errors, error notice, loading, social busy |
| `/sign-up` | `SignUpScreen` | auth | normal, field errors, error notice, loading, check-your-email |
| `/phone-login` | `PhoneLoginScreen` | auth | normal, country sheet, error, loading |
| `/otp-verification` | `OtpVerificationScreen` | auth | entry, wrong/expired code, resend countdown |
| `/forgot-password` | `ForgotPasswordScreen` | auth | normal, sent, error |
| `/reset-password` | `ResetPasswordScreen` | auth | form, updated, link expired |
| `/auth/callback` | `AuthCallbackScreen` | auth | signing in, error |
| `/choose-login-method`, `/email-login` | redirect to `/sign-in` | legacy | — |

## Component Inventory

- `components/AuthKit.tsx` — `AuthScreen`, `AuthField`, `AuthButton`, `SocialButtons`, `AuthDivider`, `AuthNotice`, `AuthSwitch`
- `authHelpers.ts` — validation, E.164, friendly errors, redirect parsing (unit tested)
- `postAuth.ts` — `routeAfterAuth()` (onboarding until complete, then Home)

## API Surface

- Supabase Auth client in `frontend/src/lib/supabase.ts`
- Identity fetched from `GET /api/v1/me` (backend-derived, not client-supplied)
- No demo sign-in path; production auth is Supabase-backed end-to-end

## Demo Fixtures

- `frontend/src/modules/auth/fixtures.ts` has been removed; authentication flows are completely live with Supabase Auth adapters and verified endpoints.

## State Patterns

- **Loading**: spinner while auth action is in flight
- **Empty**: not applicable
- **Success**: full-screen animated `AuthSuccessCelebration` takeover (via native/web `Modal`) showing verified badge, user greeting, and auto-countdown to `/home` (or immediate "Enter Dashboard Now →" skip); strictly rendered only when credentials and session verification succeed without errors
- **Error**: inline error banner with error message and retry; celebration modal is strictly suppressed on failure
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
- **Enhanced Responsiveness, In-Place Auth & Celebration Animation**: Upgraded `SignInScreen` and `SignUpScreen` with in-place segmented tabs (`[ Email ]` / `[ Phone OTP ]`) eliminating navigation hops. Added inline OTP verification on the same card with countdown timer. Added `AuthSuccessCelebration` animated takeover featuring bouncing glowing badge, pulse rings, trust pill, and animated progress bar before redirecting to `/home`. Enhanced `AuthPageLayout` with adaptive responsive widths for mobile (<600), tablet (600-1023), and desktop split view (>=1024) with keyboard tap handling.
- **Embedded Country Dropdown, Universal Name Placeholders & Card Size Stabilization**: Replaced full-screen country modal overlays with `InlinePhoneInput` (`frontend/src/modules/auth/components/InlinePhoneInput.tsx`), embedding the country flag and dial code picker directly inside the mobile input container alongside an anchored inline dropdown menu. Universalized full name placeholders to "First and last name" across all forms. Stabilized `formContentBlock` with explicit minimum heights and identical layout balance, preventing vertical card jitter and size fluctuations when toggling between Email and Phone auth tabs.
- **Zero-Cost Phone OTP Testing & Session Persistence**: Added dedicated testing credentials (`+14695550100` / `123456`) in `authStore.ts` for zero-cost automated and manual phone verification without SMS vendor costs. Exposed `useAuthStore.getState().setSession(session)` for direct session rehydration, securely persisting tokens across native `SecureStore` and browser storage. 1-tap test credential badges are wired into `PhoneLoginScreen` and `OtpVerificationScreen`.
- Security & correctness hardening (2026-10): Removed the hard-coded test phone login (469-555-0100 / code 123456) that created a fake local session, and the "tap to fill" test buttons. For test logins configure Supabase Auth test phone numbers in the dashboard instead. Backend identity is resolved with `com.manabandhu.backend.auth.Actor` (`Actor.require` returns 401 for anonymous calls; `Actor.from` for optional viewers).
- No invented social proof (2026-10): sign-up and the success celebration no longer claim member counts ("50,000+") or that a new account is "verified".

- iOS-first rebuild (2026-10): one sign-in screen (Apple, Google, email/password, link to phone) replaces the choose-method and email-login screens; large left-aligned titles, footer CTA pinned above the home indicator, Keychain/one-time-code autofill (`textContentType`, `autoComplete`, `passwordRules`), 17pt inputs so iOS Safari never zooms, plain-language errors (`friendlyAuthError`). Removed the success celebration delay, the "Bank-grade encryption"/"Trusted session"/"Multi-factor" claims, and the unused "remember this device" checkbox. All post-auth navigation goes through `useRedirectIfAuthenticated()` → `routeAfterAuth()`, so new members reach onboarding. Native Apple/Google sign-in uses `expo-web-browser` `openAuthSessionAsync` with `manabandhu://auth/callback` (previously a no-op on iOS). `/reset-password` no longer bounces the recovery session to Home, and reset links carry an explicit `redirectTo`. The root layout clears the React Query cache when the signed-in account changes so one member never sees another's cached data.
- Cleanup: auth screens load the emblem from `shared/ui/brandAssets.ts` and colours from the design-system `palette` instead of local copies.
- AuthKit shows the vector `BrandMark` (`shared/ui/BrandLogo.tsx`); `shared/ui/brandAssets.ts` and the PNG emblem were removed.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- `authStore.updateNickname(nickname)` writes `user_metadata.nickname` through `supabase.auth.updateUser`, the same auth-metadata path sign-up uses for `full_name`. It never touches `isLoading`/`status` and throws on failure so callers can show the error.
- Session fixes (2026-10-11):
  - **Reset password:** `ResetPasswordScreen` now checks the `setSession` result. A used or expired link shows "Link expired" with "Request a new link" immediately; previously it only failed after a new password was typed.
  - **`authStore.signOut`:** it rejects when Supabase refuses, leaving the member signed in, and it is the only place that navigates after signing out (to `/welcome`).
  - **Sign-out callers:** Settings and Profile go through `signOutWithFeedback()` (`foundation/account/signOut.ts`). It removes this device's push token first (best effort), then shows an alert if sign-out fails. Previously the success path navigated twice and the Profile tab swallowed errors.
  - **Splash:** the root layout runs the only `checkSession`. `SplashScreen` waits for it to settle and routes once. A slow check never sends a signed-in member to Welcome; after 8 s it offers "Try again". The 2.2 s fallback and the tap-anywhere bounce were removed.
- Legal and account (2026-10-11):
  - **Sign-up consent:** sign-up requires the `ConsentCheckbox` (links to `/terms` and `/privacy`) before email or Apple/Google sign-up. Email sign-up stores `terms_version` and `terms_accepted_at` in `user_metadata`. OAuth sign-ups do not record the version yet.
  - **Re-auth:** `foundation/account/reauth.ts` plus `ReauthSheet` (password, or a one-time code to the member's email or phone) run before deletion and before email/phone changes.
  - **Contact changes:** use `supabase.auth.updateUser`; the UI says the change waits for confirmation.
  - **Export and deletion:**
    - `GET /api/v1/me/export` returns a JSON copy of the caller's rows (`AccountService.OWNED_DATA`, fixed table list, ≤ 1000 rows per table).
    - `DELETE /api/v1/me` needs a sign-in within 10 minutes, read from the JWT `amr` timestamps (`RecentSignIn`); otherwise 401 `reauth_required`.
    - Deletion hands owned expense groups to another member, then deletes the Supabase auth user through `SupabaseAdminClient`; rows cascade. V36 makes `room_reports.reviewer_id` `ON DELETE SET NULL` so deletion is never blocked.
  - **Local stub:** it implements `DELETE/PUT /auth/v1/admin/users/{id}` (service role `local-service-role`) and puts `amr` on its tokens.
  - **Setup docs:** dashboard setup (redirect URLs, providers, templates, secrets, store URLs) is in `docs/auth/SUPABASE_SETUP.md`.
