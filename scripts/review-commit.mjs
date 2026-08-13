import { execFileSync } from 'node:child_process';
import { requiredSkillChanges } from './module-skill-rules.mjs';

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

const missing = requiredSkillChanges(staged);
if (missing.length) {
  for (const { skill } of missing)
    console.error(`Stage .codex/skills/${skill}/SKILL.md with its governed module changes.`);
  process.exit(1);
}

console.log(`Reviewed ${staged.length} staged files; module skills are synchronized.`);
