import type { ModuleMeta } from '@manabandhu/core';

/** How the Expenses module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'expenses',
  label: 'Expenses',
  summary: 'Split shared costs and settle up',
  route: '/expenses',
  icon: 'wallet',
  tone: 'primary',
  category: 'living',
  defaultRank: 8,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
