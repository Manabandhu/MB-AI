# Authentication

Owns Sign In, Sign Up, Forgot Password, session lifecycle, account recovery, identity verification, authorization-aware navigation, and Supabase Auth adapters.

The current auth routes `/sign-in`, `/sign-up`, `/forgot-password`, and related login/reset steps render through dedicated screen files in `frontend/src/modules/auth/screens/`; current demo submission can use `demo@manabandhu.local` / `DemoPass123` and returns to `/home` until Supabase auth actions are wired.

`frontend/src/lib/supabase.ts` owns the shared Supabase client and includes a static-render WebSocket fallback for Node runtimes that do not expose `globalThis.WebSocket`.

## Screens

| Screen | Route | File |
|---|---|---|
| SignInScreen | `/sign-in` | `screens/SignInScreen.tsx` |
| SignUpScreen | `/sign-up` | `screens/SignUpScreen.tsx` |
| ForgotPasswordScreen | `/forgot-password` | `screens/ForgotPasswordScreen.tsx` |
| PhoneLoginScreen | `/phone-login` | `screens/PhoneLoginScreen.tsx` |
| EmailLoginScreen | `/email-login` | `screens/EmailLoginScreen.tsx` |
| OtpVerificationScreen | `/otp-verification` | `screens/OtpVerificationScreen.tsx` |
| ResetPasswordScreen | `/reset-password` | `screens/ResetPasswordScreen.tsx` |
| ChooseLoginMethodScreen | `/choose-login-method` | `screens/ChooseLoginMethodScreen.tsx` |

## Fixtures

| Fixture | File | Purpose |
|---|---|---|
| authCredentialsFixture | `fixtures.ts` | Demo credentials |
| authFlowsFixture | `fixtures.ts` | Auth flow copy |
