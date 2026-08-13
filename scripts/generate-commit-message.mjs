import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

if (!files.length) {
  console.error('prepare-commit-msg: no staged changes are available to describe.');
  process.exit(1);
}

const areas = [];
const areaRules = [
  ['frontend', (file) => file.startsWith('frontend/')],
  ['backend', (file) => file.startsWith('backend/')],
  ['contracts', (file) => file.startsWith('packages/api-contracts/')],
  ['workflows', (file) => file.startsWith('.github/')],
  ['skills', (file) => file.startsWith('.codex/skills/')],
  ['governance', (file) => file.startsWith('.githooks/') || file.startsWith('scripts/')],
  ['documentation', (file) => file.startsWith('docs/') || file === 'README.md'],
];

for (const [area, matches] of areaRules) {
  if (files.some(matches)) areas.push(area);
}
if (!areas.length) areas.push('project configuration');

const onlyDocumentation = files.every((file) => file.startsWith('docs/') || file.endsWith('.md'));
const onlyWorkflows = files.every(
  (file) => file.startsWith('.github/') || file.startsWith('infra/deployments/'),
);
const onlyGovernance = files.every(
  (file) => file.startsWith('.githooks/') || file.startsWith('scripts/'),
);
const type = onlyDocumentation ? 'docs' : onlyWorkflows ? 'ci' : onlyGovernance ? 'chore' : 'feat';
const scope =
  areas.length === 1
    ? areas[0].replace('documentation', 'docs').replace('project configuration', 'config')
    : 'platform';
const verb =
  files.some((file) => file.includes('/future/')) || files.length > 12 ? 'restructure' : 'update';
const details = areas.slice(0, 3).join(', ');

console.log(`${type}(${scope}): ${verb} ${details}`);
