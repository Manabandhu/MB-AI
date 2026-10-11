# Supabase Auth setup

What has to be configured in the Supabase dashboard (Authentication) for sign-in, password reset, account changes,
and account deletion to work. Nothing here is stored in git; keys go into the deployment's secrets.

## URL configuration (Authentication → URL Configuration)

- **Site URL:** the public web origin, for example `https://app.manabandhu.com` (same as `EXPO_PUBLIC_WEB_URL`).
- **Redirect URLs** (add all):
  - `manabandhu://auth/callback`: OAuth and magic links in the app.
  - `manabandhu://reset-password`: password reset links opened in the app.
  - `https://<web origin>/auth/callback`: OAuth and magic links on the web.
  - `https://<web origin>/reset-password`: password reset on the web.
  - `http://localhost:8081/**`: local web development only (remove it from production projects).

## Providers (Authentication → Providers)

- **Email:** enabled, with "Confirm email" on. Sign-up then shows the "check your email" state.
- **Phone:** enabled with an SMS provider (Twilio or MessageBird) for phone login and one-time codes.
- **Apple and Google:** enabled with their client IDs and secrets. Each provider's console must also list the Supabase
  callback URL `https://<project>.supabase.co/auth/v1/callback`.

## Email templates (Authentication → Email Templates)

- **Confirm signup, Magic link, Reset password:** keep `{{ .ConfirmationURL }}`. The redirect URLs above route it back
  into the app.
- **Change email address:** Supabase sends a confirmation to the new address, and to both addresses when "Secure email
  change" is on (recommended). The Account & data screen tells the member to check their inbox.
- **Reauthentication / OTP:** the `{{ .Token }}` code is used by "Confirm it's you" before sensitive actions.

## Security settings

- **Secure email change** on; **Secure password change** on. Supabase then requires a recent sign-in to change the
  password.
- **JWT expiry:** the default (1 hour) is fine. Account deletion checks the sign-in time in the token's `amr` claim
  (within 10 minutes), which refreshes do not change.

## Backend secrets

- `SUPABASE_PROJECT_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used by the backend only (`SupabaseAdminClient`). They
  enable admin suspend/reactivate and account deletion. Without them those endpoints return 503.
- `SUPABASE_JWKS_URI`, `SUPABASE_JWT_ISSUER` and `SUPABASE_JWT_AUDIENCE` are used for token verification.

## Store listings

- Terms of Service: `https://<web origin>/terms`
- Privacy Policy: `https://<web origin>/privacy`
- Account deletion (Play "Data deletion" URL / App Store notes): in the app at Settings → Account & data → Delete
  account. Signed-in web users can use `https://<web origin>/settings/account`.
