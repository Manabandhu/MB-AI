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
  ['manabandhu-api-contracts', ['packages/api-contracts/']],
  ['manabandhu-architecture', ['docs/architecture/']],
  ['manabandhu-design-system', ['packages/design-system/', 'stitch/']],
  [
    'manabandhu-notifications',
    [
      'frontend/src/modules/notifications/',
      'platform/notifications/',
      'services/notification-worker/',
    ],
  ],
  [
    'manabandhu-ai',
    ['frontend/src/modules/ai-assistant/', 'platform/ai/', 'services/ai-orchestrator/'],
  ],
  ['manabandhu-chat', ['frontend/src/modules/chat/', 'platform/chat/', 'services/chat-realtime/']],
  ['manabandhu-immigration', ['frontend/src/modules/immigration/']],
  ['manabandhu-expenses', ['frontend/src/modules/expenses/']],
  ['manabandhu-events', ['frontend/src/modules/events/']],
  ['manabandhu-marketplace', ['frontend/src/modules/marketplace/']],
  ['manabandhu-utilities', ['frontend/src/modules/utilities/']],
  ['manabandhu-safety', ['frontend/src/modules/safety/']],
  [
    'manabandhu-analytics',
    ['frontend/src/modules/analytics/', 'platform/analytics/', 'services/analytics-pipeline/'],
  ],
  ['manabandhu-deployments', ['platform/deployments/', 'infra/deployments/', '.github/workflows/']],
  ['manabandhu-observability', ['platform/observability/', 'infra/observability/']],
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
