import type { ModuleMeta } from '@manabandhu/core';

/** How the Rooms module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'rooms',
  label: 'Rooms',
  summary: 'Shared rooms, sublets, and roommates near you',
  route: '/rooms',
  icon: 'bed',
  tone: 'primary',
  category: 'living',
  defaultRank: 1,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
