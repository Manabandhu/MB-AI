---
name: manabandhu-design-system
description: Maintain ManaBandhu's shared visual language, responsive tokens, accessibility rules, and cross-platform component foundations. Use for colors, typography, spacing, breakpoints, motion, themes, icons, components, or Stitch-to-product design translation.
---

# Design system

1. Read Stitch design-system sources and `packages/design-system/src/index.ts`.
2. Put platform-neutral tokens in `packages/design-system`; keep native/web implementation details in client components.
3. Put reusable Expo/RN UI primitives in `frontend/src/modules/shared/ui`; prefer Gluestack-backed primitives such as `AppButton`, generated components under `shared/ui/gluestack`, and `AppIcon` over screen-local controls. `AppIcon` wraps `iconoir-react-native` so icon choice and sizing stay centralized.
4. Support compact, medium, expanded, and wide windows; large text; safe areas; keyboard/pointer/touch; reduced motion; and WCAG contrast.
5. Use semantic tokens. Avoid screen-local hardcoded colors, spacing, and breakpoints.
6. Test representative phone, tablet/foldable, and browser widths.
7. Update this skill when tokens, breakpoints, component conventions, icon libraries, or accessibility rules change.
8. Current implementation: tokens exported from `packages/design-system/src/index.ts` as const objects (`color`, `darkColor`, `space`, `radius`, `shadow`, `typography`, `duration`, `iconography`, `accessibility`, `breakpoint`, `contentWidth`). Components use Gluestack-backed wrappers under `frontend/src/modules/shared/ui` and `frontend/src/modules/shared/components`.
9. Stitch design system alignment: registered `assets/18105029676315711182` (ManaBandhu Modern Vibrant) under project `9663298292574415459`. Tokens synchronized: primary `#431ebe`, primaryContainer `#5b3fd6`, teal `#00696b`, warm `#ff7e33`, pearl background `#faf8ff`, and surface `#ffffff`. Centered vector-style infinity-hands community brand emblem deployed in `frontend/assets/images/brand-logo.png`.
10. Tactile button interactions: `AppButton.tsx` upgraded with native-driven spring micro-animations (`onPressIn` scales down to 0.96 with friction 8, `onPressOut` springs back to 1.0) delivering instantaneous tactile physical feedback across all primary and secondary actions without input lag.

11. Auth surfaces (2026-10) use `frontend/src/modules/auth/components/AuthKit.tsx`: 32pt left-aligned titles, 17pt body and input text, 52pt fields and buttons with 14pt radius, primary `#431ebe` buttons, black "Continue with Apple" above a white outlined Google button, sentence-case labels (no all-caps eyebrows), and a centered 460pt card at ≥600pt widths.
- Added `tone` (surface containers, tints, pastel badge backgrounds) and `palette` (`color` + `tone`) so screens stop re-declaring hex values.
## Token package layout (2026-10)
- `packages/design-system/src/` is split into `tokens.ts` (colors, `tone`, `palette`, `darkColor`, `darkTone`, `darkPalette`, `paletteFor(scheme)`, spacing, radius, shadow, typography, breakpoints, accessibility), `brand.ts` (`brand` name, tagline, brand colors, gradient stops), and `motion.ts` (`spring` presets `snappy`/`gentle`/`bouncy`, `motion` press/hover/stagger values, `MotionPreference`). `index.ts` re-exports all three.
- `darkTone` mirrors every `tone` key so `darkPalette` and `palette` have identical keys. The unused `saffronPalette` was removed.
- `pnpm --filter @manabandhu/design-system tokens:json` writes `dist/tokens.json` (gitignored) for non-JS clients such as future SwiftUI watch, Android for Cars, or TV code.
- The Tamagui config in `frontend/src/theme/tamagui.config.ts` is built only from these tokens (themes `light`/`dark` plus `primary`, `teal`, `warm`, `danger` sub-themes; media `medium`/`expanded`/`wide` from `breakpoint`).
