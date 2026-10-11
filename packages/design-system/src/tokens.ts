export const color = {
  background: '#faf8ff',
  ink: '#131b2e',
  muted: '#625f6e',
  primary: '#431ebe',
  primaryContainer: '#5b3fd6',
  primarySoft: '#e5deff',
  surface: '#ffffff',
  teal: '#00696b',
  warm: '#ff7e33',
  border: '#e2e8f0',
  success: '#1b873f',
  error: '#ba1a1a',
  warning: '#d97706',
  info: '#2563eb',
  overlay: 'rgba(19,27,46,0.48)',
  skeleton: '#e5deff',
} as const;

/**
 * Tonal surfaces and soft accent tints layered on `color` (light theme). Screens use `palette`, which merges both,
 * instead of re-declaring these hex values locally.
 */
export const tone = {
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  /** Translucent fills behind primary, teal, and warm icons or chips. */
  primaryTint: 'rgba(67,30,190,0.07)',
  tealTint: 'rgba(0,105,107,0.08)',
  warmTint: 'rgba(255,126,51,0.10)',
  /** Opaque pastel backgrounds for badges and icon wells. */
  tealBg: '#e6f4f4',
  warmBg: '#fff0e8',
  successBg: '#e6f7ed',
  errorBg: '#fde2e2',
  infoBg: '#e0ecff',
  goldBg: '#fef3c7',
  goldText: '#b45309',
} as const;

export const palette = { ...color, ...tone } as const;

export const darkColor = {
  background: '#0f1525',
  ink: '#f1f5ff',
  muted: '#9aa3b2',
  primary: '#a78bfa',
  primaryContainer: '#6d48d7',
  primarySoft: '#2e245a',
  surface: '#1a2138',
  teal: '#34d399',
  warm: '#ff955e',
  border: '#2a3348',
  success: '#4ade80',
  error: '#fca5a5',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(15,21,37,0.64)',
  skeleton: '#2e245a',
} as const;

/** Dark counterparts of every `tone` key, so `darkPalette` mirrors `palette` one to one. */
export const darkTone = {
  surfaceContainerLowest: '#131a2d',
  surfaceContainerLow: '#182036',
  surfaceContainer: '#1e2740',
  surfaceContainerHigh: '#252f4b',
  primaryTint: 'rgba(167,139,250,0.14)',
  tealTint: 'rgba(52,211,153,0.14)',
  warmTint: 'rgba(255,149,94,0.16)',
  tealBg: '#12343a',
  warmBg: '#3a2418',
  successBg: '#143322',
  errorBg: '#3a1414',
  infoBg: '#13294a',
  goldBg: '#3a2e10',
  goldText: '#fcd34d',
} as const;

export const darkPalette = { ...darkColor, ...darkTone } as const;

export type PaletteKey = keyof typeof palette;
export type ColorScheme = 'light' | 'dark';

/** Resolves the palette for a colour scheme; screens that are not on Tamagui yet use this instead of hex values. */
export function paletteFor(scheme: ColorScheme) {
  return scheme === 'dark' ? darkPalette : palette;
}

/** Window classes start at these widths. `narrow` marks cover screens and very small phones inside `compact`. */
export const breakpoint = {
  compact: 0,
  narrow: 360,
  medium: 600,
  expanded: 1024,
  wide: 1440,
} as const;
export const contentWidth = { compact: 560, medium: 880, expanded: 1200, wide: 1320 } as const;
export const space = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
  x12: 48,
  x16: 64,
} as const;
export const radius = { control: 12, card: 16, panel: 24, pill: 999 } as const;

export const shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#131b2e',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  md: {
    elevation: 4,
    shadowColor: '#131b2e',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  lg: {
    elevation: 8,
    shadowColor: '#131b2e',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  xl: {
    elevation: 12,
    shadowColor: '#131b2e',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
} as const;

export const duration = { instant: 0, fast: 120, normal: 220, slow: 320, slower: 480 } as const;

export const typography = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: -0.5 } as const,
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.3 } as const,
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '800', letterSpacing: -0.2 } as const,
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '800', letterSpacing: 0 } as const,
  h4: { fontSize: 17, lineHeight: 24, fontWeight: '800', letterSpacing: 0 } as const,
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400', letterSpacing: 0 } as const,
  bodyStrong: { fontSize: 16, lineHeight: 25, fontWeight: '700', letterSpacing: 0 } as const,
  lead: { fontSize: 18, lineHeight: 28, fontWeight: '400', letterSpacing: 0 } as const,
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '700', letterSpacing: 0.2 } as const,
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 0.8 } as const,
  mono: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.2 } as const,
} as const;

export const iconography = {
  size: { xs: 16, sm: 20, md: 24, lg: 32, xl: 48 } as const,
  strokeWidth: { thin: 1.5, regular: 2.25, bold: 3 } as const,
} as const;

export const accessibility = {
  minTouchTarget: 44,
  minContrastRatio: 4.5,
  focusRingWidth: 3,
  focusRingColor: '#431ebe',
  reducedMotion: false,
  /** Text scales with the OS setting up to this factor; layouts are verified at this size. */
  maxFontScale: 1.6,
} as const;
