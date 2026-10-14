import { gitLines } from './lib/files.mjs';
import { requiredSkillChanges } from './module-skill-rules.mjs';

const staged = gitLines(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);

const missing = requiredSkillChanges(staged);
if (missing.length) {
  for (const { skill } of missing)
    console.error(`Stage .codex/skills/${skill}/SKILL.md with its governed module changes.`);
  process.exit(1);
}

console.log(`Reviewed ${staged.length} staged files; module skills are synchronized.`);
