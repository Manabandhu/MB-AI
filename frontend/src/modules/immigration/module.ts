import type { ModuleMeta } from '@manabandhu/core';

/** How the Immigration module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'immigration',
  label: 'Immigration',
  summary: 'Visa guides, checklists, and USCIS updates',
  route: '/immigration',
  icon: 'plane',
  tone: 'primary',
  category: 'essentials',
  defaultRank: 9,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
