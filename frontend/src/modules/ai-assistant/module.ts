import type { ModuleMeta } from '@manabandhu/core';

/** How the Assistant module appears in launchers (Home quick access, Explore, future TV/car/watch menus). */
export const moduleMeta = {
  key: 'assistant',
  label: 'Assistant',
  summary: 'Ask questions and get cited answers',
  keywords: ['ask', 'question', 'help', 'ai', 'chatbot', 'answers'],
  route: '/assistant',
  icon: 'sparks',
  tone: 'warm',
  category: 'essentials',
  defaultRank: 13,
  surfaces: ['phone', 'tablet', 'desktop'],
} as const satisfies ModuleMeta;
