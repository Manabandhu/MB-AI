---
name: manabandhu-auth
description: Maintain ManaBandhu authentication, registration, sessions, account recovery, identity verification, authorization-aware navigation, and Supabase Auth integration. Use for changes under the frontend auth module or shared identity behavior.
---

# Authentication

1. Read `frontend/src/modules/auth/MODULE.md`, backend security configuration, and affected contracts.
2. Keep Sign In, Sign Up, Forgot Password, auth UI, hooks, schemas, state, and adapters inside `frontend/src/modules/auth`; expose only intentional public APIs.
3. The auth routes `/sign-in`, `/sign-up`, `/forgot-password`, and related login/reset steps use `frontend/src/modules/foundation/screens/StitchPrototypeScreens.tsx`; temporary demo login shows `demo@manabandhu.local` / `DemoPass123` and returns to `/home` until Supabase auth actions are wired. The legacy `frontend/src/modules/auth/screens/AuthScreen.tsx` file was removed.
4. `frontend/src/lib/supabase.ts` owns the shared Supabase client and may provide a static-render WebSocket fallback only when `globalThis.WebSocket` is missing.
5. Store native sessions with Secure Store and use supported browser persistence on web. Never log tokens or place service credentials in the client.
6. Derive authorization from verified server-side JWT claims. Never trust client state or editable user metadata for privileged roles; the Super Admin local/demo public override is the only temporary exception and is controlled server-side.
7. Cover sign-in, sign-out, refresh, expiry, recovery, verification, cancellation, offline, and deep-link behavior across native and web.
8. Run frontend lint, typecheck, affected tests, and an Expo web export.
9. Update this skill with auth paths, providers, claims, persistence, contracts, or security invariants.
