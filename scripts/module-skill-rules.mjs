export const moduleSkillRules = [
  ['manabandhu-mobile-platform', ['frontend/universal/', 'frontend/future/']],
  ['manabandhu-backend-api', ['backend/']],
  [
    'manabandhu-super-admin',
    ['frontend/universal/src/app/admin', 'backend/src/main/java/com/manabandhu/backend/admin/'],
  ],
  ['manabandhu-api-contracts', ['packages/api-contracts/']],
  ['manabandhu-architecture', ['docs/architecture/']],
  ['manabandhu-design-system', ['packages/design-system/', 'stitch/']],
  ['manabandhu-notifications', ['platform/notifications/', 'services/notification-worker/']],
  ['manabandhu-ai', ['platform/ai/', 'services/ai-orchestrator/']],
  ['manabandhu-chat', ['platform/chat/', 'services/chat-realtime/']],
  ['manabandhu-analytics', ['platform/analytics/', 'services/analytics-pipeline/']],
  ['manabandhu-deployments', ['platform/deployments/', 'infra/deployments/', '.github/workflows/']],
  ['manabandhu-observability', ['platform/observability/', 'infra/observability/']],
];

export function requiredSkillChanges(files) {
  const changed = new Set(files);
  return moduleSkillRules
    .filter(([, prefixes]) => [...changed].some((file) => prefixes.some((prefix) => file.startsWith(prefix))))
    .filter(([skill]) => !changed.has(`.codex/skills/${skill}/SKILL.md`))
    .map(([skill, prefixes]) => ({ skill, prefixes }));
}
