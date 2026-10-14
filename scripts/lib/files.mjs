import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Shared file and git helpers for the verify-*/review-* scripts. Paths are relative to the current directory, so run
// the scripts from the repository root (as the pnpm scripts and CI do).

/** Recursively lists files under `dir` (skipping node_modules) whose path satisfies `predicate`. */
export function walk(dir, predicate = () => true, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, predicate, out);
    else if (predicate(path)) out.push(path);
  }
  return out;
}

/** Runs git and returns trimmed stdout; throws when git fails. */
export function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/** Runs git and returns non-empty output lines. With `tolerant`, a failing git command yields no lines. */
export function gitLines(args, { tolerant = false } = {}) {
  try {
    return git(args).split('\n').filter(Boolean);
  } catch (error) {
    if (tolerant) return [];
    throw error;
  }
}

/** Every file tracked by git (handles unusual file names via -z). */
export function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
}
