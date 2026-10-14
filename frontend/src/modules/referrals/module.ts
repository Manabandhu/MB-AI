import type { ModuleMeta } from '@manabandhu/core';

/** How the Referrals module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'referrals',
  label: 'Referrals',
  summary: 'Ask for or offer employee referrals',
  keywords: ['referral', 'refer', 'career', 'hiring', 'interview', 'networking'],
  route: '/referrals',
  icon: 'handshake',
  tone: 'teal',
  category: 'career',
  defaultRank: 5,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
