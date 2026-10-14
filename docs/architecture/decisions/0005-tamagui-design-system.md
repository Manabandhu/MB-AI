# ADR 0005: Tamagui as the single UI toolkit

Status: accepted (2026-10)

The client had three overlapping styling approaches (Gluestack wrappers, Uniwind/Tailwind classes, and per-screen `StyleSheet` objects with their own colour constants). Screens drifted visually, dark mode was not possible, and every module re-declared the palette.

Decision:

- Tamagui 2.7.7 is the one UI toolkit for every module, configured only from `@manabandhu/design-system` tokens (`frontend/src/theme/tamagui.config.ts`). It runs without the optimizing compiler for now; enabling it later is a pure performance change.
- Animations use Tamagui's CSS driver on web and its Reanimated driver on native, with the same named transitions.
- Shared primitives live in `frontend/src/modules/shared/ui` (`AppText`, `AppButton`, `Card`, `ListRow`, `TextField`, `Screen`, `Section`, `ResponsiveGrid`, `BrandLogo`, …). Icons go through `AppIcon` (Lucide, imported one file per icon).
- Theme (system/light/dark), motion level, and language are device-local member choices held in `useAppearanceStore`.
- Gluestack and iconoir were removed. Uniwind stays until the last screen using classes is migrated.
- `scripts/verify-design-system.mjs` (part of `pnpm verify` and CI Governance) is a ratchet: files may not add colour literals, local palettes, numeric breakpoints, or icon/toolkit imports; the baseline only shrinks as each module is reviewed.

Consequences: modules migrate one at a time without blocking each other, and a module review is "done" when its entries leave the baseline.
