# ADR 0007: Shared core for future watch, car, and TV clients

Status: accepted (2026-10). Supersedes the "no placeholder runtimes" note in ADR 0003 for shared code only.

ManaBandhu will later target Apple Watch / Wear OS, CarPlay / Android Auto, TV (Apple TV / Android TV), and continues to target phone, tablet, foldable, and web. Watch and car platforms cannot run the phone UI: car apps use platform templates and watch apps are best built natively; TV needs remote-focus navigation.

Decision:

- Everything below the UI is shareable and platform-free: `packages/core` (`@manabandhu/core`) holds the HTTP client, response parsing, error types, formatters, and module metadata types. `pnpm verify:core` forbids React, React Native, Expo, Supabase, and Tamagui imports there.
- Design tokens are exported as JSON (`pnpm --filter @manabandhu/design-system tokens:json` → `dist/tokens.json`) so SwiftUI, Jetpack Compose, or car-template code can use the same colours, spacing, and typography.
- The Expo app models form factors in `frontend/src/platform/formFactor.ts` (`phone`, `tablet`, `desktop`, `tv`, with `car` and `watch` reserved). Layout still follows window class; form factor only selects navigation chrome and input affordances. Shared primitives are focusable with visible focus rings so TV remote navigation works when `react-native-tvos` is adopted.
- When a target is started: TV joins the same Expo app via `react-native-tvos`; CarPlay / Android Auto use `react-native-carplay` / Android for Cars templates fed by `@manabandhu/core` (rides and notifications first); watch apps are native companions calling the same REST API with `tokens.json`. Each `ModuleMeta.surfaces` lists where a module is designed to appear.

Consequences: no runtime dependencies for watch, car, or TV are added until a target starts, but nothing in core or tokens needs rewriting when one does.
