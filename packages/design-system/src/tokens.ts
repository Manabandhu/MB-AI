export const color = {
  background: '#f7f7f8',
  ink: '#1c1b20',
  muted: '#5c5c66',
  primary: '#4d35c8',
  onPrimary: '#ffffff',
  primaryContainer: '#5b3fd6',
  primarySoft: '#e8e2fa',
  surface: '#ffffff',
  teal: '#00696b',
  warm: '#b84b15',
  border: '#e5e5e9',
  success: '#16733c',
  error: '#ba1a1a',
  warning: '#d97706',
  info: '#2563eb',
  overlay: 'rgba(19,27,46,0.48)',
  skeleton: '#e8e2fa',
} as const;

/**
 * Tonal surfaces and soft accent tints layered on `color` (light theme). Screens use `palette`, which merges both,
 * instead of re-declaring these hex values locally.
 */
export const editorial = {
  editorialSurface: '#17171b',
  editorialInk: '#fcfaf5',
  editorialMuted: '#c2becb',
  editorialAccent: '#d3c4ff',
  editorialSuccess: '#9addbc',
  editorialWarm: '#f3bf9f',
  editorialDanger: '#7c2133',
  editorialBorder: '#3e3b49',
  artViolet: '#e8e0ff',
  artMint: '#dceee6',
  artPeach: '#f8e5d8',
  artBlue: '#e0e8f5',
  artInk: '#282330',
  artPaper: '#fffdf8',
  artPurple: '#9d83df',
  artPurpleShade: '#6a4db0',
  artGreen: '#75a58e',
  artGreenShade: '#416d5b',
  artCopper: '#da9b75',
  artCopperShade: '#a96142',
  artShadow: 'rgba(32,25,45,0.12)',
} as const;

export const tone = {
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eeece7',
  surfaceContainer: '#e5e2dc',
  surfaceContainerHigh: '#dcd8d1',
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

export const palette = { ...color, ...tone, ...editorial } as const;

export const darkColor = {
  background: '#101013',
  ink: '#f7f5f0',
  muted: '#b9b5bf',
  primary: '#bca6ff',
  onPrimary: '#160b3d',
  primaryContainer: '#6d48d7',
  primarySoft: '#2e245a',
  surface: '#1c1c21',
  teal: '#34d399',
  warm: '#ff955e',
  border: '#35353c',
  success: '#4ade80',
  error: '#fca5a5',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(15,21,37,0.64)',
  skeleton: '#2e245a',
} as const;

/** Dark counterparts of every `tone` key, so `darkPalette` mirrors `palette` one to one. */
export const darkTone = {
  surfaceContainerLowest: '#161619',
  surfaceContainerLow: '#232329',
  surfaceContainer: '#2b2b32',
  surfaceContainerHigh: '#33333b',
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

export const darkPalette = { ...darkColor, ...darkTone, ...editorial } as const;

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
export const radius = { control: 12, card: 16, panel: 20, pill: 999 } as const;

export const shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#1c1b20',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  md: {
    elevation: 4,
    shadowColor: '#1c1b20',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  lg: {
    elevation: 8,
    shadowColor: '#1c1b20',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  xl: {
    elevation: 12,
    shadowColor: '#1c1b20',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
} as const;

export const duration = { instant: 0, fast: 120, normal: 220, slow: 320, slower: 480 } as const;

export const typography = {
  display: { fontSize: 42, lineHeight: 46, fontWeight: '700', letterSpacing: -1.6 } as const,
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1 } as const,
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.2 } as const,
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: 0 } as const,
  h4: { fontSize: 17, lineHeight: 24, fontWeight: '700', letterSpacing: 0 } as const,
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400', letterSpacing: 0 } as const,
  bodyStrong: { fontSize: 16, lineHeight: 25, fontWeight: '700', letterSpacing: 0 } as const,
  lead: { fontSize: 18, lineHeight: 28, fontWeight: '400', letterSpacing: 0 } as const,
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400', letterSpacing: 0 } as const,
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8 } as const,
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
  focusRingColor: '#4d35c8',
  reducedMotion: false,
  /** Text scales with the OS setting up to this factor; layouts are verified at this size. */
  maxFontScale: 1.6,
} as const;
