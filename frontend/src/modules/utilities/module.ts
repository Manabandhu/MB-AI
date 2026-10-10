import type { ModuleMeta } from '@manabandhu/core';

/** How the Utilities module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'utilities',
  label: 'Utilities',
  summary: 'Nearby services, packages, and emergency info',
  route: '/utilities',
  icon: 'zap',
  tone: 'teal',
  category: 'living',
  defaultRank: 10,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
