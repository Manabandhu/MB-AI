# Authentication

Owns Sign In, Sign Up, phone sign-in with SMS codes, Forgot/Reset Password, OAuth (Apple, Google), the sign-in
callback, session lifecycle, and where a member lands after signing in. Authentication is Supabase Auth end to end;
there is no demo sign-in path.

`frontend/src/lib/authStore.ts` owns the session store and Supabase calls. `frontend/src/lib/supabase.ts` owns the shared
client (chunked SecureStore sessions on native).

## Flow

1. `/welcome` → "Get started" (`/sign-up`) or "I already have an account" (`/sign-in`).
2. Sign in or up with Apple, Google, email + password, or phone (`/phone-login` → `/otp-verification`).
3. `useRedirectIfAuthenticated()` on every auth route calls `routeAfterAuth()` (`postAuth.ts`): onboarding
   (`/onboarding/what-brings-you-here`) until `isCompleted`, then `/home`. Screens never navigate after success.
4. Email sign-ups that need confirmation show "Check your email"; the link returns through `/auth/callback`.
5. Forgot password sends a link to `/reset-password` (web) or `manabandhu://reset-password` (app); that route has no
   signed-in redirect because the recovery link itself signs the member in.

## Screens

| Screen | Route | File |
|---|---|---|
| SignInScreen | `/sign-in` | `screens/SignInScreen.tsx` |
| SignUpScreen | `/sign-up` | `screens/SignUpScreen.tsx` |
| PhoneLoginScreen | `/phone-login` | `screens/PhoneLoginScreen.tsx` |
| OtpVerificationScreen | `/otp-verification` | `screens/OtpVerificationScreen.tsx` |
| ForgotPasswordScreen | `/forgot-password` | `screens/ForgotPasswordScreen.tsx` |
| ResetPasswordScreen | `/reset-password` | `screens/ResetPasswordScreen.tsx` |
| AuthCallbackScreen | `/auth/callback` | `screens/AuthCallbackScreen.tsx` |

`/choose-login-method` and `/email-login` redirect to `/sign-in` so older links keep working.

## Building blocks

- `components/AuthKit.tsx`: `AuthScreen` (safe areas, keyboard avoidance, large title, footer pinned above the home
  indicator, centered card at ≥600pt), `AuthField` (52pt, 17pt text, autofill props, show/hide password),
  `AuthButton`, `SocialButtons` (Apple first), `AuthDivider`, `AuthNotice`, `AuthSwitch`.
- `authHelpers.ts`: pure helpers covered by `frontend/test/authHelpers.test.mjs` (email/password rules, E.164,
  friendly Supabase error messages, OAuth/recovery redirect parsing).
- `postAuth.ts`: `routeAfterAuth()`.

## Configuration required in Supabase Auth

- Redirect URLs: `https://<web-origin>/auth/callback`, `https://<web-origin>/reset-password`,
  `manabandhu://auth/callback`, `manabandhu://reset-password`.
- Providers: Apple and Google enabled with their client IDs; Phone with an SMS provider (e.g. Twilio).
- Locally, `scripts/local-dev/auth.mjs serve` stands in for these endpoints (codes are written to `.local-dev/jwks.log`).

## Terms consent (2026-10-13)

Every signed-in account must have `user_metadata.terms_version`. Email sign-up writes it; Apple/Google sign-up records
the consent ticked before the redirect (`consent.ts`); any other account (Apple/Google or phone from Sign In, older
accounts) is sent once to `/accept-terms` by `routeAfterAuth()`. `/accept-terms` → `screens/AcceptTermsScreen.tsx`.

## Legal documents and sign-out (2026-10-30)

`legal/content.ts` (Terms of Service, Privacy Policy, `TERMS_VERSION`) and `legal/LegalScreen.tsx` (`/terms`,
`/privacy`) live here because consent is recorded here; `utils/signOut.ts` (`confirmSignOut`, `signOutWithFeedback`)
also moved in from foundation. Public API (`index.ts`): `AuthButton`, `OTP_CODE_LENGTH`, `ONBOARDING_START`,
`routeAfterAuth`, `confirmSignOut`. Auth may import `notifications` and `onboarding` (through their `index.ts`), never
a feature module or foundation.
