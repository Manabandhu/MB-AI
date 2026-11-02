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
  background: '#0b0a14',
  ink: '#f4f2ff',
  muted: '#a29fb8',
  primary: '#a78bfa',
  primaryContainer: '#6d48d7',
  primarySoft: '#2e245a',
  surface: '#16142a',
  teal: '#34d399',
  warm: '#ff955e',
  border: '#2a2742',
  success: '#4ade80',
  error: '#fca5a5',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(6,5,12,0.72)',
  skeleton: '#2e245a',
} as const;

/** Dark counterparts of every `tone` key, so `darkPalette` mirrors `palette` one to one. */
export const darkTone = {
  surfaceContainerLowest: '#110f20',
  surfaceContainerLow: '#181630',
  surfaceContainer: '#1f1c3a',
  surfaceContainerHigh: '#272446',
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
export const radius = { control: 14, card: 20, panel: 28, pill: 999 } as const;

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

/**
 * Category colours: one vivid gradient pair per launcher module (start → end, top-left to bottom-right) plus the
 * glow behind it. Every stop keeps white text and icons at 3:1 or better (WCAG AA for large text and icons). The same
 * values work in light and dark themes because they always sit on their own gradient.
 */
export const category = {
  rooms: { from: '#8b5cf6', to: '#4c1d95', glow: 'rgba(139,92,246,0.35)' },
  rides: { from: '#0d9488', to: '#134e5e', glow: 'rgba(20,184,166,0.35)' },
  jobs: { from: '#ea580c', to: '#9a3412', glow: 'rgba(251,146,60,0.35)' },
  referrals: { from: '#d97706', to: '#92400e', glow: 'rgba(245,158,11,0.35)' },
  community: { from: '#db2777', to: '#9d174d', glow: 'rgba(236,72,153,0.35)' },
  events: { from: '#e11d48', to: '#a21caf', glow: 'rgba(244,63,94,0.35)' },
  marketplace: { from: '#16a34a', to: '#14532d', glow: 'rgba(34,197,94,0.35)' },
  expenses: { from: '#3b82f6', to: '#1e3a8a', glow: 'rgba(59,130,246,0.35)' },
  immigration: { from: '#6366f1', to: '#312e81', glow: 'rgba(99,102,241,0.35)' },
  utilities: { from: '#0891b2', to: '#164e63', glow: 'rgba(6,182,212,0.35)' },
  safety: { from: '#dc2626', to: '#991b1b', glow: 'rgba(239,68,68,0.35)' },
  chat: { from: '#7c5cf0', to: '#2a0f8a', glow: 'rgba(124,92,240,0.35)' },
  assistant: { from: '#ea580c', to: '#a21caf', glow: 'rgba(255,126,51,0.35)' },
} as const;
export type CategoryKey = keyof typeof category;

/** Resolves a module key to its category colours, falling back to the brand violet for unknown keys. */
export function categoryFor(key: string) {
  return (category as Record<string, (typeof category)[CategoryKey]>)[key] ?? category.chat;
}

/** Aurora blobs drawn behind hero areas (welcome, Home header). Light and dark use the same hues. */
export const aurora = {
  violet: '#8b5cf6',
  saffron: '#ff7e33',
  pink: '#ec4899',
  teal: '#14b8a6',
  /** Deep base the blobs glow on. */
  base: ['#2a0f8a', '#22097a', '#33149e'] as const,
} as const;

export const duration = { instant: 0, fast: 120, normal: 220, slow: 320, slower: 480 } as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '900', letterSpacing: -1 } as const,
  h1: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.6 } as const,
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
