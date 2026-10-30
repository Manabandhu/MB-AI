import type { ModuleMeta } from '@manabandhu/core';

/** How the Events module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'events',
  label: 'Events',
  summary: 'Cultural, social, and professional events',
  keywords: ['festival', 'meetup', 'diwali', 'ugadi', 'networking', 'party', 'cultural'],
  route: '/events',
  icon: 'event',
  tone: 'warm',
  category: 'community',
  defaultRank: 6,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
