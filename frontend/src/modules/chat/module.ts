import type { ModuleMeta } from '@manabandhu/core';

/** How the Chat module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'chat',
  label: 'Chat',
  summary: 'Your conversations with members',
  route: '/chat',
  icon: 'message',
  tone: 'primary',
  category: 'community',
  defaultRank: 12,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
