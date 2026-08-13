---
name: manabandhu-mobile-platform
description: Maintain ManaBandhu's Expo and React Native client across iOS, Android, phone, tablet, foldable, mobile browser, tablet browser, and desktop web. Use for routing, navigation, responsive layout, platform capabilities, accessibility, client state, offline behavior, or future watch/TV compatibility boundaries.
---

# Mobile platform

1. Read the Expo SDK 54 documentation, `docs/architecture/platform.md`, `frontend/src/platform/adaptive.ts`, and the affected module under `frontend/src/modules`.
2. Design by window size, input capability, safe area, orientation, font scale, and reduced-motion preference. Never branch on device model.
3. Keep phone, tablet, foldable, and web behavior in one Expo app unless an interaction model requires a separate shell.
4. Preserve keyboard, pointer, touch, deep-link, offline, accessibility, and responsive-web behavior.
5. Keep the Expo workspace directly under `frontend`. Keep routes thin and organize every business capability under `frontend/src/modules/<module>`.
6. Keep the adaptive operations surface at `/admin`; it may request allow-listed operations but must never receive infrastructure credentials or arbitrary execution capability. Its temporary public demo access is controlled server-side.
7. Address the workspace as `@manabandhu/frontend`; validate with `pnpm lint` and an Expo export for affected platforms.
8. Keep Expo export output (`dist/`, `dist-*`, and `web-build/`) ignored; CI uploads build artifacts rather than committing them.
9. Do not create watch or TV placeholder folders until those targets are activated.
10. Use Zustand 5 for shared client state; dependency resolutions must satisfy the workspace supply-chain release-age policy.
11. Treat `frontend/src/modules/screen-catalog.ts` as the canonical screen and route inventory. Keep Expo Router entries thin and use module-qualified IDs for repeated screen names.
12. The public launch flow begins at `/`, continues through `/welcome`, and keeps the backend-status home surface at `/home`.
13. Keep Expo SDK 54 aligned through `expo install --fix`: React Native 0.81, React 19.1, React Native Web 0.21, and Node 20.19.4 or newer. Prefer a development build when a current physical-iOS Expo Go no longer supports SDK 54.
14. Update this skill when targets, breakpoints, routing, commands, dependencies, or invariants change.
