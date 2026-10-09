import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Every `apiFetch('/api/v1/...')` call in the frontend must match a Spring mapping. A mismatch means a screen
// calls an endpoint that does not exist and can only ever show an error (or worse, a silent fallback).

function walk(dir, predicate, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, predicate, out);
    else if (predicate(path)) out.push(path);
  }
  return out;
}

const routes = [];
for (const file of walk('backend/src/main/java', (p) => p.endsWith('Controller.java'))) {
  const source = readFileSync(file, 'utf8');
  const base =
    source.match(/@RequestMapping\(\s*(?:(?:value|path)\s*=\s*)?\{?\s*"([^"]*)"/)?.[1] ?? '';
  for (const match of source.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?/g)) {
    const paths = match[2] ? [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1]) : [''];
    for (const path of paths.length ? paths : ['']) {
      const pattern = `${base}${path}`.replace(/\{[^}]+\}/g, '[^/]+');
      routes.push({ method: match[1].toUpperCase(), regex: new RegExp(`^${pattern}$`) });
    }
  }
}

const missing = [];
let calls = 0;
let unchecked = 0;
for (const file of walk('frontend/src', (p) => /\.tsx?$/.test(p))) {
  const source = readFileSync(file, 'utf8');
  const callPattern = /apiFetch\(\s*([`'])(\/api\/v1[^`']*)\1(\s*,\s*\{[^)]*?method:\s*'(\w+)')?/gs;
  for (const match of source.matchAll(callPattern)) {
    calls += 1;
    const method = (match[4] ?? 'GET').toUpperCase();
    const path = match[2].split('?')[0].replace(/\$\{[^}]+\}/g, 'x');
    const known = routes.some((route) => route.method === method && route.regex.test(path));
    if (!known) missing.push(`${file}: ${method} ${match[2]}`);
  }
  // Paths built outside the call (variables, helpers) cannot be checked statically; report how many there are.
  for (const match of source.matchAll(/apiFetch\(\s*([^\s`'),][^,)]*)/g)) {
    if (!match[1].startsWith('/')) unchecked += 1;
  }
}

if (missing.length > 0) {
  console.error(`Frontend calls with no matching backend route (${missing.length}):`);
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}
console.log(
  `Verified ${calls} frontend API calls match ${routes.length} backend routes` +
    (unchecked ? ` (${unchecked} calls build their path dynamically and were not checked).` : '.'),
);
