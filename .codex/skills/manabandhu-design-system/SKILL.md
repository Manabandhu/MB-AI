---
name: manabandhu-design-system
description: Maintain ManaBandhu's shared visual language, responsive tokens, accessibility rules, and cross-platform component foundations. Use for colors, typography, spacing, breakpoints, motion, themes, icons, brand assets, components, or Stitch-to-product design translation.
---

# Design system

## Sources of truth
1. Tokens: `packages/design-system/src/` — `tokens.ts` (colors, `tone`, `palette`, `darkColor`, `darkTone`, `darkPalette`, `paletteFor(scheme)`, space, radius, shadow, typography, breakpoints, `contentWidth`, accessibility), `brand.ts` (`brand` name, tagline, colors, gradient stops), `motion.ts` (`spring` presets `snappy`/`gentle`/`bouncy`, `motion` press/hover/stagger values, `MotionPreference`). `index.ts` re-exports all three. `darkTone` mirrors every `tone` key.
2. `pnpm --filter @manabandhu/design-system tokens:json` writes `dist/tokens.json` (gitignored) for non-JS clients (future SwiftUI watch, Android for Cars, TV).
3. Toolkit: Tamagui 2.7.7 in runtime mode (no compiler). `frontend/src/theme/tamagui.config.ts` is built only from the tokens: themes `light`/`dark` plus sub-themes `primary`, `teal`, `warm`, `danger`; media `medium`/`expanded`/`wide`/`compactOnly`/`belowExpanded`/`pointerFine`/`hoverable`; font sizes named after typography (`$h1`, `$body`, …); space `$x1`…`$x16`; radius `$control`/`$card`/`$panel`/`$pill`; size `$touch` (44) and `$control` (52). Animations: `theme/animations.ts` (web, `@tamagui/animations-css`, compositor-driven) and `theme/animations.native.ts` (`@tamagui/animations-reanimated`, springs from `spring` tokens) expose the same keys (`quick`, `gentle`, `bouncy`, `fast`, `normal`, `slow`); the prop is `transition`. Tamagui 2 uses web-standard accessibility props (`role`, `aria-label`, `aria-selected`, `aria-live`, …), not `accessibility*`.
4. Theme choice: `AppThemeProvider` + `useAppearanceStore` (`system | light | dark`, motion `full | reduced | off`, device-local). `useAppearance()` returns `{ scheme, palette, reduceMotion, richMotion }`.

## Brand
- Mark: two arches sharing one leg (an "M", and open arms around a friend) in white on the violet gradient `#7c5cf0 → #431ebe → #2a0f8a`, with a saffron `#ff7e33` dot. Sources: `frontend/assets/brand/logo-mark.svg`, `logo-glyph.svg` (Android adaptive foreground), `logo-mono.svg` (themed/notification icon), `icon-background.svg`, `logo-wordmark.svg`.
- `pnpm brand:icons` (`scripts/brand/render-icons.mjs`, `sharp`) renders `icon.png`, Android adaptive layers, `splash-icon.png`, `favicon.png`, and PWA icons in `frontend/public/`. Re-run it after editing any brand SVG; never hand-edit the PNGs.
- In app code use `BrandMark` / `BrandLogo variant="wordmark"` (`shared/ui/BrandLogo.tsx`, react-native-svg); keep its paths in sync with `logo-mark.svg`.

## Components (`frontend/src/modules/shared/ui`, barrel `index.ts`)
- `AppText`/`Heading` (variants `display h1 h2 h3 h4 lead body bodyStrong label caption overline`, tones `default muted primary onPrimary danger success warm teal`, font scale capped at `accessibility.maxFontScale`), `AppButton` (`primary secondary ghost danger`, sizes `sm md lg`, haptic on native, press scale from `motion.pressScale`), `Card` (`outlined elevated filled tinted`; `href`/`onPress` makes it pressable with hover lift), `ListRow` (standard listing row), `Chip`, `Avatar` (photo or initials), `IconButton` (44pt, required label), `TextField` (label/helper/error), `SegmentedControl`, `Skeleton`/`SkeletonCard`, `Section`, `Screen` (safe areas, max content width, pull-to-refresh), `ResponsiveGrid` (columns per window class), `GradientSurface`, `FadeIn` (Reanimated entrance), `AppIcon`.
- `AppIcon` maps semantic names to Lucide icons imported one file each (`lucide-react-native/icons/<name>`, so unused icons never ship) plus Google/Apple marks, and defaults to the theme text colour. Add names there; never import an icon library elsewhere.
- Shared states in `shared/components`: `LoadingState` (`spinner`/`skeleton`), `ErrorState` and `EmptyState` (optional action, `compact` for cards), `WidgetFrame` (Home widget chrome).
- Gluestack was removed (2026-10). Screens not yet migrated still use `StyleSheet` + design-system constants or Uniwind classes; migrate them to these primitives during each module's review.

## Rules
1. Use semantic tokens and theme values (`$primary`, `palette.primary`); no hex literals, local colour objects, or numeric breakpoints in screens.
2. Support compact, medium, expanded, and wide windows; large text; safe areas; keyboard/pointer/touch/remote focus (`focusable` + `focusVisibleStyle`); reduced motion; WCAG AA contrast. Icon-only controls need labels.
3. Every animation checks `useAppearance().reduceMotion`; decorative loops and 3D only run when `richMotion` is true.
4. Test phone (390), tablet (820), landscape tablet (1180), and desktop (1440) widths in light and dark.
5. Update this skill when tokens, breakpoints, component conventions, icon libraries, brand assets, or accessibility rules change.

## History
- Stitch "ManaBandhu Modern Vibrant" (`assets/18105029676315711182`, project `9663298292574415459`) set the palette: primary `#431ebe`, primaryContainer `#5b3fd6`, teal `#00696b`, warm `#ff7e33`, background `#faf8ff`, surface `#ffffff`.
- Auth surfaces use `frontend/src/modules/auth/components/AuthKit.tsx` (32pt titles, 52pt fields/buttons, 14pt radius, 460pt card at ≥600pt) with `BrandMark` as the logo.
## Motion and 3D (2026-10)
- Motion primitives in `shared/ui/motion/`: `FadeIn` (staggered entrance), `AnimatedBrandMark` (tile springs in, saffron dot drops, gentle float), `CountUp` (animates real numeric metrics only). All are static with reduced motion.
- `shared/ui/hero/BrandHero3D`: on web, a lazily imported three.js / react-three-fiber scene (`BrandScene.web.tsx`: extruded logo tile, white arches, orbiting community spheres, pointer parallax; `flat` to keep brand colours). It renders only when `richMotion` is on and WebGL is available, and shows `AnimatedBrandMark` while loading or otherwise. Native uses `AnimatedBrandMark` until an `expo-gl` scene is verified on devices. three.js is fetched only when a hero is shown.
- Deliberately not added: Lottie (needs licensed assets and a separate web player) and Skia (CanvasKit adds about 3 MB of wasm on web). SVG gradients (`GradientSurface`) and Reanimated cover the same effects at no extra cost. Revisit if a design needs them.
- Dark theme `onPrimary` is `#160b3d` (the dark primary is light violet, so white text failed WCAG AA). On web the page background follows the explicit theme choice.
- `breakpoint.narrow` (360) marks cover screens and very small phones inside `compact`.
- Ratchet: `pnpm verify:design` (`scripts/verify-design-system.mjs`, also in CI Governance) counts colour literals, local palette objects, numeric width breakpoints, and icon/toolkit imports per module file against `scripts/design-baseline.json`. Counts may only go down; `--update` locks in improvements. `shared/ui` is exempt.
- ADR 0005 records the Tamagui decision, ADR 0006 module-owned Home widgets, ADR 0007 the shared core for watch/car/TV.
- Ratchet rules also count `hsl()`/`hsla()` colours and local palette objects declared at any indentation (inside components too); the stricter rules found no new violations, so the baseline is unchanged.
