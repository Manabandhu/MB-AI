export const moduleSkillRules = [
  ['manabandhu-mobile-platform', ['frontend/']],
  [
    'manabandhu-foundation',
    ['frontend/src/modules/foundation/', 'frontend/src/modules/screen-catalog.ts'],
  ],
  ['manabandhu-auth', ['frontend/src/modules/auth/']],
  ['manabandhu-rooms', ['frontend/src/modules/rooms/']],
  ['manabandhu-rides', ['frontend/src/modules/rides/']],
  ['manabandhu-jobs', ['frontend/src/modules/jobs/']],
  ['manabandhu-referrals', ['frontend/src/modules/referrals/']],
  [
    'manabandhu-community',
    ['frontend/src/modules/community/', 'backend/src/main/java/com/manabandhu/backend/post/'],
  ],
  ['manabandhu-backend-api', ['backend/']],
  [
    'manabandhu-super-admin',
    [
      'frontend/src/app/admin',
      'frontend/src/modules/admin/',
      'backend/src/main/java/com/manabandhu/backend/admin/',
    ],
  ],
  ['manabandhu-admin', ['frontend/src/app/admin/', 'frontend/src/modules/admin/']],
  ['manabandhu-api-contracts', ['packages/api-contracts/']],
  ['manabandhu-architecture', ['docs/architecture/', 'packages/core/']],
  ['manabandhu-design-system', ['packages/design-system/']],
  [
    'manabandhu-notifications',
    [
      'frontend/src/modules/notifications/',
      'backend/src/main/java/com/manabandhu/backend/notifications/',
    ],
  ],
  [
    'manabandhu-ai',
    ['frontend/src/modules/ai-assistant/', 'backend/src/main/java/com/manabandhu/backend/ai/'],
  ],
  [
    'manabandhu-chat',
    ['frontend/src/modules/chat/', 'backend/src/main/java/com/manabandhu/backend/chat/'],
  ],
  ['manabandhu-immigration', ['frontend/src/modules/immigration/']],
  ['manabandhu-expenses', ['frontend/src/modules/expenses/']],
  ['manabandhu-events', ['frontend/src/modules/events/']],
  ['manabandhu-marketplace', ['frontend/src/modules/marketplace/']],
  ['manabandhu-utilities', ['frontend/src/modules/utilities/']],
  ['manabandhu-safety', ['frontend/src/modules/safety/']],
  // Analytics has no runtime code yet; the skill holds the rules for when instrumentation is added.
  ['manabandhu-analytics', []],
  ['manabandhu-deployments', ['.github/workflows/', 'frontend/eas.json']],
  ['manabandhu-observability', ['backend/src/main/java/com/manabandhu/backend/health/']],
];

export function requiredSkillChanges(files) {
  const changed = new Set(files);
  return moduleSkillRules
    .filter(([, prefixes]) =>
      [...changed].some((file) => prefixes.some((prefix) => file.startsWith(prefix))),
    )
    .filter(([skill]) => !changed.has(`.codex/skills/${skill}/SKILL.md`))
    .map(([skill, prefixes]) => ({ skill, prefixes }));
}
