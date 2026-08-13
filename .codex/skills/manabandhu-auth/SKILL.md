---
name: manabandhu-auth
description: Maintain ManaBandhu authentication, registration, sessions, account recovery, identity verification, authorization-aware navigation, and Supabase Auth integration. Use for changes under the frontend auth module or shared identity behavior.
---

# Authentication

1. Read `frontend/src/modules/auth/MODULE.md`, backend security configuration, and affected contracts.
2. Keep Sign In, Sign Up, Forgot Password, auth UI, hooks, schemas, state, and adapters inside `frontend/src/modules/auth`; expose only intentional public APIs.
3. Store native sessions with Secure Store and use supported browser persistence on web. Never log tokens or place service credentials in the client.
4. Derive authorization from verified server-side JWT claims. Never trust client state or editable user metadata for privileged roles; the Super Admin local/demo public override is the only temporary exception and is controlled server-side.
5. Cover sign-in, sign-out, refresh, expiry, recovery, verification, cancellation, offline, and deep-link behavior across native and web.
6. Run frontend lint, typecheck, affected tests, and an Expo web export.
7. Update this skill with auth paths, providers, claims, persistence, contracts, or security invariants.
