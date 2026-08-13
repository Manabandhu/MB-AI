# Authentication

Owns Sign In, Sign Up, Forgot Password, session lifecycle, account recovery, identity verification, authorization-aware navigation, and Supabase Auth adapters.

The current auth routes `/sign-in`, `/sign-up`, `/forgot-password`, and related login/reset steps render through `frontend/src/modules/foundation/screens/StitchPrototypeScreens.tsx`; current demo submission can use `demo@manabandhu.local` / `DemoPass123` and returns to `/home` until Supabase auth actions are wired. The legacy `screens/AuthScreen.tsx` file was removed.

`frontend/src/lib/supabase.ts` owns the shared Supabase client and includes a static-render WebSocket fallback for Node runtimes that do not expose `globalThis.WebSocket`.
