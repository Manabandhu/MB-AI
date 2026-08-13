# Authentication

Owns Sign In, Sign Up, Forgot Password, session lifecycle, account recovery, identity verification, authorization-aware navigation, and Supabase Auth adapters.

The first Stitch batch routes `/sign-in`, `/sign-up`, and `/forgot-password` render through `screens/AuthScreen.tsx`; current demo submission returns to `/home` until Supabase auth actions are wired.

`frontend/src/lib/supabase.ts` owns the shared Supabase client and includes a static-render WebSocket fallback for Node runtimes that do not expose `globalThis.WebSocket`.
