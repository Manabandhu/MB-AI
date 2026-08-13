export const moduleSkillRules = [
  ['manabandhu-mobile-platform', ['frontend/']],
  ['manabandhu-auth', ['frontend/src/modules/auth/']],
  [
    'manabandhu-community',
    ['frontend/src/modules/community/', 'backend/src/main/java/com/manabandhu/backend/post/'],
  ],
  ['manabandhu-backend-api', ['backend/']],
  [
    'manabandhu-super-admin',
    [
      'frontend/src/app/admin',
      'frontend/src/modules/super-admin/',
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
