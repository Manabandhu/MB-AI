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
