import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const rules = [
  ['manabandhu-mobile-platform', ['apps/mobile/', 'apps/future/']],
  ['manabandhu-backend-api', ['apps/backend/']],
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

function gitLines(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const baseRef = process.env.SKILL_BASE_REF;
const committedChanges = baseRef
  ? gitLines(['diff', '--name-only', `${baseRef}...HEAD`])
  : gitLines(['diff', '--name-only', 'HEAD']);
const changed = new Set([
  ...committedChanges,
  ...gitLines(['diff', '--name-only', '--cached']),
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]);

const errors = [];
for (const [skill, prefixes] of rules) {
  const path = `.codex/skills/${skill}/SKILL.md`;
  const body = readFileSync(path, 'utf8');
  if (!body.startsWith(`---\nname: ${skill}\ndescription:`) || body.includes('TODO')) {
    errors.push(`${path} has invalid or incomplete metadata`);
  }
  const moduleChanged = [...changed].some((file) =>
    prefixes.some((prefix) => file.startsWith(prefix)),
  );
  if (moduleChanged && !changed.has(path)) {
    errors.push(`${skill} must change because governed files changed: ${prefixes.join(', ')}`);
  }
}

const skillCount = readdirSync('.codex/skills', { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
).length;
if (skillCount !== rules.length)
  errors.push(`Expected ${rules.length} skills, found ${skillCount}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Verified ${rules.length} module skills and change-coupling rules.`);
