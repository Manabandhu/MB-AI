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
- `AppIcon` maps semantic names (2026-10-11 added `swap`, `repeat`, `list`, `minus`, `more`) to Lucide icons imported one file each (`lucide-react-native/icons/<name>`, so unused icons never ship) plus Google/Apple marks, and defaults to the theme text colour. Add names there; never import an icon library elsewhere.
- Shared states in `shared/components`: `LoadingState` (`spinner`/`skeleton`), `ErrorState` (optional action with `actionIcon`, default `refresh`, `null` for none) and `EmptyState` (optional action, `compact` for cards), `WidgetFrame` (Home widget chrome). The legacy `Badge` and `StarRating` were deleted.

### Primitive inventory (2026-10-11, all exported from `shared/ui/index.ts`)
- `Chip {label, icon?, selected?, onPress?, accessibilityLabel?, variant?: 'filter'|'tag', radio?, disabled?}`: pressable chips are 44pt with a focus ring; `radio` announces `role=radio` + `aria-checked`, otherwise `aria-pressed`; `tag` is neutral (`$surfaceContainer`, muted text), never focusable or pressable.
- `FilterChipRow {label, children, role?: 'group'|'radiogroup'}`: one horizontally scrolling chip row.
- `SegmentedControl {label, options: {value, label, icon?, count?}[], value, onChange}`: 44pt radio segments; `count` renders a small badge.
- `AppButton` sizes `sm` (44pt, tighter padding) `md` `lg`. `IconButton` takes `disabled`. `BackButton {fallback?: Href|string}`.
- `StatusBadge {label, tone?: 'neutral'|'primary'|'success'|'warning'|'danger'|'info', icon?}`: pastel `*Bg` token, body-colour text (AA), tone-coloured dot or icon.
- `ScreenHeader {title, subtitle?, back?: {fallback: Href}|false, actions?, primaryAction?: {label, icon?, onPress?, route?: Href}}`: `h2` heading row that wraps when narrow; no back button unless `back` is given.
- `ActionBar {children, leading?, label?}` + `ACTION_BAR_SPACE` (96): sticky bottom bar (surface, top border, safe-area padding, content capped at `maxContentWidth`). Render after `Screen` in a `flex: 1` parent and pass `<Screen bottomInset={ACTION_BAR_SPACE}>`.
- `Screen` adds `keyboardAvoiding` (iOS `padding`) and `maxWidth: 'form'|'content'` (`form` = `FORM_MAX_WIDTH` 640). `BottomSheet` adds `scrollable`.
- `ConfirmProvider` (mounted in `app/_layout.tsx`), `useConfirm()` → `confirm({title, body, confirmLabel, cancelLabel?, destructive?}): Promise<boolean>`, `ConfirmSheet`. `shared/ui/notify.ts`: `showError(title, error|message, fallback?)`, `showMessage`, `confirm(options)`, `confirmAction(title, message, confirmLabel, {destructive?, cancelLabel?})` (routes to the sheet; platform dialog fallback). Module `utils/notify.ts` files re-export it.
- `NumberStepper {label, value, min, max, onChange, helper?, error?, step?}`: "Decrease/Increase {label}" `IconButton`s disabled at the bounds, value in an `aria-live` region. Math in `shared/ui/fieldMath.ts` (tested by `frontend/test/fieldMath.test.mjs`).
- `RatingInput {value, onChange, labels?, label?}`: 44pt stars, radiogroup semantics.
- `DateTimeField {label, value: Date|null, onChange, mode: 'date'|'datetime', minimumDate?, maximumDate?, error?, helper?, timeLabel?}`: web uses a token-styled `<input type="date|datetime-local">`; native shows 7 day chips, "Pick a date…" (month-grid `BottomSheet`), and in `datetime` mode a ±15 min stepper plus quick-time chips.
- `PersonRow {name, imageUrl?, subtitle?, badge?, actions?, href?}`: avatar row; only the avatar/text area follows `href`, so actions never trigger it.
- `OwnerItemCard {status?, trailing?, title, meta?: string[], note?, imageUrl?, href?, onPress?, actions?, overflow?: {label, icon?, onPress, destructive?}[]}`: owner list card, at most 2 inline actions, "More" `IconButton` opens a sheet with `overflow`.

### Usage rules
- `StatusBadge` for statuses, never a selected `Chip`; `Chip variant="tag"` for read-only tags.
- `ActionBar` for a detail page's primary actions; `ScreenHeader` for page headers; `OwnerItemCard` for "my listings/rides" lists; `PersonRow` for people.
- Confirm with `useConfirm` (or `confirmAction`); `destructive: true` only for delete, cancel and remove.
- `heart` is the save icon app-wide (not `bookmark`).
- Every interactive control has a 44pt target, a role, a label and a `focusVisibleStyle`.
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
- `BottomSheet` (`shared/ui/BottomSheet.tsx`): Reanimated slide-up, drag handle (pan to close), backdrop/✕/Android-back close, height capped at `window − insets.top − 12`, keyboard-aware bottom padding, centred at most 640 wide, theme-aware. Use it for every sheet.
- `Screen` takes `hero` (a full-bleed block that pads for the notch itself). Inside the tab navigator it detects `BottomTabBarHeightContext` and adds only 24 pt at the bottom, because the tab bar already covers the home indicator. `GradientSurface` gains `corners="bottom"` and is `position: relative` (web stacks are not positioned by default, so the absolute gradient escaped its container).
- Tokens (2026-10-11): `tone`/`darkTone` gain `errorBg` and `infoBg` (themes pick them up through the palette spread; the `danger` sub-theme uses `errorBg`).
