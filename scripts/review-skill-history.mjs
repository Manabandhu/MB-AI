import { execFileSync } from 'node:child_process';
import { requiredSkillChanges } from './module-skill-rules.mjs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const base = process.env.SKILL_BASE_REF?.trim();
const range = base ? `${base}..HEAD` : '-50';
const commits = git(
  base ? ['rev-list', '--reverse', range] : ['rev-list', '--reverse', range, 'HEAD'],
)
  .split('\n')
  .filter(Boolean);
const failures = [];

for (const commit of commits) {
  const files = git(['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', commit])
    .split('\n')
    .filter(Boolean);
  for (const { skill } of requiredSkillChanges(files)) failures.push({ commit, skill });
}

if (failures.length) {
  for (const { commit, skill } of failures)
    console.error(`${commit.slice(0, 12)} changed a governed module without updating ${skill}.`);
  process.exit(1);
}

console.log(`Audited ${commits.length} commits; no module-skill drift found.`);
