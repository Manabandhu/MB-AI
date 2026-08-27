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
| `/sign-in` | `SignInScreen` | auth | normal, error, loading |
| `/sign-up` | `SignUpScreen` | auth | normal, error, loading |
| `/forgot-password` | `ForgotPasswordScreen` | auth | normal, success, error |
| `/phone-login` | `PhoneLoginScreen` | auth | normal, error, loading |
| `/email-login` | `EmailLoginScreen` | auth | normal, error, loading |
| `/otp-verification` | `OtpVerificationScreen` | auth | normal, error, loading |
| `/reset-password` | `ResetPasswordScreen` | auth | normal, success, error |
| `/choose-login-method` | `ChooseLoginMethodScreen` | auth | normal |

## Component Inventory

- `SignInScreen` - email/password sign-in with demo credentials
- `SignUpScreen` - account creation form
- `ForgotPasswordScreen` - password reset initiation
- `PhoneLoginScreen` - phone number entry
- `EmailLoginScreen` - email magic link / OAuth entry
- `OtpVerificationScreen` - OTP entry with countdown
- `ResetPasswordScreen` - new password form
- `ChooseLoginMethodScreen` - auth method selector
- Shared: `ScreenShell`, `FormScreen`, `Input`, `AppButton`, `Text`, `Link`, `CountdownTimer`

## API Surface

- Supabase Auth client in `frontend/src/lib/supabase.ts`
- Demo submission uses `demo@manabandhu.local` / `DemoPass123` and returns to `/home` until Supabase auth actions are wired
- No custom REST endpoints; auth state is derived from verified JWT claims

## Demo Fixtures

- `frontend/src/modules/auth/fixtures.ts` - `authCredentialsFixture` and `authFlowsFixture`

## State Patterns

- **Loading**: spinner while auth action is in flight
- **Empty**: not applicable
- **Error**: inline error message with retry
- **Success**: auto-navigate to `/home`
- **Offline**: disable submit, show offline banner
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- `/sign-in` -> `/home` on success, `/forgot-password`
- `/sign-up` -> `/home` on success, `/sign-in`
- `/forgot-password` -> `/reset-password`
- `/phone-login` -> `/otp-verification`
- `/email-login` -> `/home` on success
- `/otp-verification` -> `/home` on success
- `/reset-password` -> `/home` on success
- `/choose-login-method` -> `/phone-login` or `/email-login`

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

- **Partial**: All auth screens are implemented with demo credentials. Supabase auth actions are not yet fully wired; demo login returns to `/home`. Phone/email login, OTP, and password reset screens are UI-complete.
- Recent fixes: auth screen imports now group the Supabase client import with other client imports, `authStore.ts` uses `_get` to avoid an unused getter lint, and `SignInScreen.tsx` removed an unused `AuthError` import.
