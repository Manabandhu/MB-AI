/**
 * ManaBandhu brand identity. The mark is two interlocking arcs (two friends, "bandhu") that read as an "M", on a
 * violet gradient with a warm saffron dot (the welcome light). Native watch, car, and TV clients read the same values
 * from `dist/tokens.json`.
 */
export const brand = {
  name: 'ManaBandhu',
  shortName: 'ManaBandhu',
  tagline: 'Your community, close to home',
  description:
    'ManaBandhu helps newcomers find rooms, rides, jobs, referrals, events, and friends in one trusted community app.',
  color: {
    primary: '#431ebe',
    primaryDeep: '#2a0f8a',
    primaryLight: '#7c5cf0',
    accent: '#ff7e33',
    teal: '#00a3a6',
    onPrimary: '#ffffff',
    themeLight: '#faf8ff',
    themeDark: '#0f1525',
  },
  /** Gradient stops used by the logo tile, hero backgrounds, and the app icon (top-left to bottom-right). */
  gradient: ['#5b3fd6', '#431ebe', '#2a0f8a'] as const,
} as const;
