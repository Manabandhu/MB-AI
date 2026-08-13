---
name: manabandhu-mobile-platform
description: Maintain ManaBandhu's Expo and React Native client across iOS, Android, phone, tablet, foldable, mobile browser, tablet browser, and desktop web. Use for routing, navigation, responsive layout, platform capabilities, accessibility, client state, offline behavior, or future watch/TV compatibility boundaries.
---

# Mobile platform

1. Read `docs/architecture/platform.md`, `frontend/src/platform/adaptive.ts`, and the affected module under `frontend/src/modules`.
2. Design by window size, input capability, safe area, orientation, font scale, and reduced-motion preference. Never branch on device model.
3. Keep phone, tablet, foldable, and web behavior in one Expo app unless an interaction model requires a separate shell.
4. Preserve keyboard, pointer, touch, deep-link, offline, accessibility, and responsive-web behavior.
5. Keep the Expo workspace directly under `frontend`. Keep routes thin and organize every business capability under `frontend/src/modules/<module>`.
6. Keep the restricted adaptive operations surface at `/admin`; it may request allow-listed operations but must never receive infrastructure credentials or arbitrary execution capability.
7. Address the workspace as `@manabandhu/frontend`; validate with `pnpm lint` and an Expo export for affected platforms.
8. Do not create watch or TV placeholder folders until those targets are activated.
9. Use Zustand 5 for shared client state; dependency resolutions must satisfy the workspace supply-chain release-age policy.
10. Update this skill when targets, breakpoints, routing, commands, dependencies, or invariants change.
