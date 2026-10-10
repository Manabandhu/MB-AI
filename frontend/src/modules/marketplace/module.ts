import type { ModuleMeta } from '@manabandhu/core';

/** How the Marketplace module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'marketplace',
  label: 'Marketplace',
  summary: 'Buy and sell with people nearby',
  route: '/marketplace',
  icon: 'marketplace',
  tone: 'teal',
  category: 'essentials',
  defaultRank: 7,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
