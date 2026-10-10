import {
  brand,
  breakpoint,
  darkPalette,
  palette,
  radius as radiusTokens,
  space as spaceTokens,
  typography,
} from '@manabandhu/design-system';
import { createAnimations } from '@tamagui/animations-reanimated';
import { createFont, createTamagui, createTokens } from 'tamagui';

/**
 * The one Tamagui config for every ManaBandhu module. Values come from `@manabandhu/design-system`; never add hex
 * values here that are not tokens there. Media keys mirror `platform/adaptive.ts` window classes.
 */

const animations = createAnimations({
  quick: { type: 'spring', damping: 18, stiffness: 320, mass: 0.6 },
  gentle: { type: 'spring', damping: 20, stiffness: 180, mass: 0.9 },
  bouncy: { type: 'spring', damping: 10, stiffness: 200, mass: 0.8 },
  fast: { type: 'timing', duration: 120 },
  normal: { type: 'timing', duration: 220 },
  slow: { type: 'timing', duration: 320 },
});

const space = {
  0: 0,
  x1: spaceTokens.x1,
  x2: spaceTokens.x2,
  x3: spaceTokens.x3,
  x4: spaceTokens.x4,
  x5: spaceTokens.x5,
  x6: spaceTokens.x6,
  x8: spaceTokens.x8,
  x10: spaceTokens.x10,
  x12: spaceTokens.x12,
  x16: spaceTokens.x16,
  true: spaceTokens.x4,
} as const;

const tokens = createTokens({
  color: {
    brand: brand.color.primary,
    accent: brand.color.accent,
    white: '#ffffff',
    black: '#000000',
  },
  space,
  size: { ...space, touch: 44, control: 52, avatarSm: 32, avatarMd: 40, avatarLg: 56 },
  radius: { 0: 0, ...radiusTokens, true: radiusTokens.card },
  zIndex: { 0: 0, base: 1, sticky: 10, nav: 50, overlay: 100, toast: 200, true: 1 },
});

const sizeKeys = Object.keys(typography) as (keyof typeof typography)[];
const pick = <K extends 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight'>(key: K) =>
  Object.fromEntries([
    ...sizeKeys.map((name) => [name, typography[name][key]]),
    ['true', typography.body[key]],
  ]) as Record<keyof typeof typography | 'true', (typeof typography)['body'][K]>;

const systemFont = createFont({
  family: 'System',
  size: pick('fontSize'),
  lineHeight: pick('lineHeight'),
  letterSpacing: pick('letterSpacing'),
  weight: pick('fontWeight'),
});

type Palette = { [K in keyof typeof palette]: string };

function baseTheme(p: Palette, dark: boolean) {
  return {
    ...p,
    background: p.background,
    backgroundHover: p.surfaceContainerLow,
    backgroundPress: p.surfaceContainer,
    backgroundFocus: p.surfaceContainerLow,
    backgroundStrong: p.surface,
    color: p.ink,
    colorHover: p.ink,
    colorPress: p.ink,
    colorFocus: p.ink,
    colorMuted: p.muted,
    borderColor: p.border,
    borderColorHover: p.primarySoft,
    borderColorFocus: p.primary,
    borderColorPress: p.primary,
    placeholderColor: p.muted,
    outlineColor: p.primary,
    shadowColor: dark ? '#000000' : '#131b2e',
    onPrimary: '#ffffff',
  };
}

/** Accent sub-themes: wrap a subtree in <Theme name="primary"> etc. to recolour its solid controls. */
function accent(base: ReturnType<typeof baseTheme>, solid: string, soft: string) {
  return {
    ...base,
    background: solid,
    backgroundHover: solid,
    backgroundPress: solid,
    backgroundFocus: solid,
    color: '#ffffff',
    colorHover: '#ffffff',
    colorPress: '#ffffff',
    colorMuted: soft,
    borderColor: solid,
  };
}

const light = baseTheme(palette, false);
const dark = baseTheme(darkPalette, true);

const themes = {
  light,
  dark,
  light_primary: accent(light, palette.primary, palette.primarySoft),
  dark_primary: accent(dark, darkPalette.primaryContainer, darkPalette.primarySoft),
  light_teal: accent(light, palette.teal, palette.tealBg),
  dark_teal: accent(dark, '#0f766e', darkPalette.tealBg),
  light_warm: accent(light, '#c2410c', palette.warmBg),
  dark_warm: accent(dark, '#c2410c', darkPalette.warmBg),
  light_danger: accent(light, palette.error, '#fde2e2'),
  dark_danger: accent(dark, '#b91c1c', '#3a1414'),
} as const;

export const config = createTamagui({
  animations,
  tokens,
  themes,
  fonts: { body: systemFont, heading: systemFont },
  media: {
    medium: { minWidth: breakpoint.medium },
    expanded: { minWidth: breakpoint.expanded },
    wide: { minWidth: breakpoint.wide },
    compactOnly: { maxWidth: breakpoint.medium - 1 },
    belowExpanded: { maxWidth: breakpoint.expanded - 1 },
    pointerFine: { pointer: 'fine' },
    hoverable: { hover: 'hover' },
  },
  settings: {
    defaultFont: 'body',
    fastSchemeChange: true,
    shouldAddPrefersColorThemes: false,
    allowedStyleValues: 'somewhat-strict-web',
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
