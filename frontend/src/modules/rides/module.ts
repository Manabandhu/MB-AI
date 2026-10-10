import type { ModuleMeta } from '@manabandhu/core';

/** How the Rides module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'rides',
  label: 'Rides',
  summary: 'Offer or find carpools and airport rides',
  route: '/rides',
  icon: 'car',
  tone: 'teal',
  category: 'living',
  defaultRank: 2,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
