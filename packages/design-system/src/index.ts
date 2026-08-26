export const color = {
  background: '#faf8ff',
  ink: '#131b2e',
  muted: '#625f6e',
  primary: '#431ebe',
  primarySoft: '#e5deff',
  surface: '#ffffff',
  teal: '#00696b',
  border: '#e2e8f0',
  success: '#1b873f',
  error: '#ba1a1a',
  warning: '#d97706',
  info: '#2563eb',
  overlay: 'rgba(19,27,46,0.48)',
  skeleton: '#e5deff',
} as const;

export const darkColor = {
  background: '#0f1525',
  ink: '#f1f5ff',
  muted: '#9aa3b2',
  primary: '#a78bfa',
  primarySoft: '#2e245a',
  surface: '#1a2138',
  teal: '#34d399',
  border: '#2a3348',
  success: '#4ade80',
  error: '#fca5a5',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(15,21,37,0.64)',
  skeleton: '#2e245a',
} as const;

export const breakpoint = { compact: 0, medium: 600, expanded: 1024, wide: 1440 } as const;
export const contentWidth = { compact: 560, medium: 880, expanded: 1200, wide: 1320 } as const;
export const space = { x1: 4, x2: 8, x3: 12, x4: 16, x5: 20, x6: 24, x8: 32, x10: 40, x12: 48, x16: 64 } as const;
export const radius = { control: 12, card: 16, panel: 24, pill: 999 } as const;

export const shadow = {
  sm: { elevation: 2, shadowColor: '#131b2e', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  md: { elevation: 4, shadowColor: '#131b2e', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  lg: { elevation: 8, shadowColor: '#131b2e', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  xl: { elevation: 12, shadowColor: '#131b2e', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } },
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
} as const;
