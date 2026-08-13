import { readFileSync } from 'node:fs';

const path = process.argv[2];
const message = readFileSync(path, 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join(' ')
  .trim();
const words = message.split(/\s+/).filter(Boolean);

if (!message) {
  console.error('commit-msg: commit message cannot be empty.');
  process.exit(1);
}
if (words.length > 20) {
  console.error(`commit-msg: use no more than 20 words; received ${words.length}.`);
  process.exit(1);
}
if (
  !/^(feat|fix|docs|refactor|test|build|ci|chore|perf|revert)(\([a-z0-9-]+\))?!?: [a-z0-9]/.test(
    message,
  )
) {
  console.error(
    'commit-msg: use Conventional Commits, for example: feat(frontend): add adaptive profile module',
  );
  process.exit(1);
}

console.log(`commit-msg: valid Conventional Commit message (${words.length}/20 words).`);
