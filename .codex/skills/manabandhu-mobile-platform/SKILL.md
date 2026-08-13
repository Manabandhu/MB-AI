---
name: manabandhu-mobile-platform
description: Maintain ManaBandhu's Expo and React Native client across iOS, Android, phone, tablet, foldable, mobile browser, tablet browser, and desktop web. Use for routing, navigation, responsive layout, platform capabilities, accessibility, client state, offline behavior, or future watch/TV compatibility boundaries.
---

# Mobile platform

1. Read `docs/architecture/platform.md`, `apps/mobile/src/platform/adaptive.ts`, and the affected feature.
2. Design by window size, input capability, safe area, orientation, font scale, and reduced-motion preference. Never branch on device model.
3. Keep phone, tablet, foldable, and web behavior in one Expo app unless an interaction model requires a separate shell.
4. Preserve keyboard, pointer, touch, deep-link, offline, accessibility, and responsive-web behavior.
5. Keep watch and TV under `apps/future`; do not add their runtime dependencies until activated.
6. Validate with `pnpm lint` and an Expo export for affected platforms.
7. Update this skill when targets, breakpoints, routing, commands, dependencies, or invariants change.

