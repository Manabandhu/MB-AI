import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { git } from './lib/files.mjs';

// Fallback for GitHub's dependency review when the repository's dependency graph is off: audit the pnpm lockfile at
// the base and head revisions and fail only on advisories the change introduces, so long-standing advisories on the
// base branch do not block unrelated pull requests. Usage: node scripts/audit-new-vulnerabilities.mjs <base> [head]

const [baseRef, headRef = 'HEAD'] = process.argv.slice(2);
if (!baseRef) {
  console.error('usage: node scripts/audit-new-vulnerabilities.mjs <base-ref> [head-ref]');
  process.exit(2);
}
const ranks = { low: 1, moderate: 2, high: 3, critical: 4 };
const threshold = ranks[process.env.AUDIT_LEVEL ?? 'moderate'];

function advisories(ref) {
  const dir = mkdtempSync(join(tmpdir(), 'audit-'));
  try {
    git(['worktree', 'add', '--detach', dir, ref]);
    // pnpm audit exits non-zero whenever it finds anything; only the JSON report matters here.
    const run = spawnSync('pnpm', ['audit', '--json'], {
      cwd: dir,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    let report;
    try {
      report = JSON.parse(run.stdout);
    } catch {
      throw new Error(`pnpm audit at ${ref} did not return JSON:\n${run.stderr || run.stdout}`);
    }
    if (report.error)
      throw new Error(`pnpm audit at ${ref} failed: ${JSON.stringify(report.error)}`);
    const found = new Map();
    for (const a of Object.values(report.advisories ?? {})) {
      if ((ranks[a.severity] ?? 0) < threshold) continue;
      found.set(`${a.github_advisory_id ?? a.id}:${a.module_name}`, a);
    }
    return found;
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', dir]);
    rmSync(dir, { recursive: true, force: true });
  }
}

const before = advisories(baseRef);
const after = advisories(headRef);
const introduced = [...after].filter(([key]) => !before.has(key)).map(([, a]) => a);
const fixed = [...before.keys()].filter((key) => !after.has(key)).length;

console.log(
  `Advisories at or above ${process.env.AUDIT_LEVEL ?? 'moderate'}: base ${before.size}, head ${after.size}, fixed ${fixed}.`,
);
for (const a of introduced) {
  console.error(
    `::error title=New ${a.severity} advisory::${a.module_name} ${a.github_advisory_id ?? a.id}: ${a.title} (patched: ${a.patched_versions})`,
  );
}
if (introduced.length) process.exit(1);
console.log('No new vulnerable dependencies introduced.');
