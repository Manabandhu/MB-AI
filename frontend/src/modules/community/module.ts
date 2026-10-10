import type { ModuleMeta } from '@manabandhu/core';

/** How the Community module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'community',
  label: 'Community',
  summary: 'Local groups, questions, and advice',
  route: '/community',
  icon: 'community',
  tone: 'primary',
  category: 'community',
  defaultRank: 3,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
