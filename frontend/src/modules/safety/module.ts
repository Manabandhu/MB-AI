import type { ModuleMeta } from '@manabandhu/core';

/** How the Safety module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'safety',
  label: 'Safety',
  summary: 'Trusted contacts, reports, and blocked users',
  route: '/safety',
  icon: 'shield',
  tone: 'danger',
  category: 'safety',
  defaultRank: 11,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
