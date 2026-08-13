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
} as const;

export const breakpoint = { compact: 0, medium: 600, expanded: 1024, wide: 1440 } as const;
export const contentWidth = { compact: 560, medium: 880, expanded: 1200 } as const;
export const space = { x1: 4, x2: 8, x3: 12, x4: 16, x6: 24, x8: 32, x12: 48 } as const;
export const radius = { control: 12, card: 16, panel: 24, pill: 999 } as const;
