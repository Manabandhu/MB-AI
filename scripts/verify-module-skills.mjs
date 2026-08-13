import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { requiredSkillChanges, moduleSkillRules as rules } from './module-skill-rules.mjs';

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
for (const [skill] of rules) {
  const path = `.codex/skills/${skill}/SKILL.md`;
  const body = readFileSync(path, 'utf8');
  if (!body.startsWith(`---\nname: ${skill}\ndescription:`) || body.includes('TODO')) {
    errors.push(`${path} has invalid or incomplete metadata`);
  }
}
for (const { skill, prefixes } of requiredSkillChanges(changed))
  errors.push(`${skill} must change because governed files changed: ${prefixes.join(', ')}`);

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
