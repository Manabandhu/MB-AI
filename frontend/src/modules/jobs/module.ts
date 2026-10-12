import type { ModuleMeta } from '@manabandhu/core';

/** How the Jobs module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'jobs',
  label: 'Jobs',
  summary: 'Job postings shared by members',
  keywords: ['work', 'career', 'hiring', 'openings', 'h1b', 'opt', 'remote', 'full-time'],
  route: '/jobs',
  icon: 'briefcase',
  tone: 'warm',
  category: 'career',
  defaultRank: 4,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
