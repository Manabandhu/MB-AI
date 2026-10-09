import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { walk } from './lib/files.mjs';

// `frontend/src/modules/screen-catalog.ts` is the product screen inventory. Fail when it names a route that has no
// file under `frontend/src/app`, or when a routed screen exists that the catalog does not list.

const appDir = 'frontend/src/app';
// Alternate URLs for a screen the catalog already lists under its canonical route.
const aliases = new Set(['/splash']);
const catalog = readFileSync('frontend/src/modules/screen-catalog.ts', 'utf8');

const catalogRoutes = new Set();
for (const [, args] of catalog.matchAll(/\bscreen\(([^)]*)\)/g)) {
  const strings = [...args.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  if (strings.length < 3) continue; // the helper's own definition
  const [module, slug, , route] = strings;
  catalogRoutes.add(route ?? `/${module}/${slug}`);
}

const fileRoutes = new Set();
for (const file of walk(appDir, (p) => /\.(tsx|ts)$/.test(p))) {
  const segments = relative(appDir, file)
    .replace(/(\.web|\.native|\.ios|\.android)?\.tsx?$/, '')
    .split('/')
    .filter((s) => !/^\(.*\)$/.test(s));
  const last = segments.at(-1);
  if (last === '_layout' || last.startsWith('+')) continue;
  if (last === 'index') segments.pop();
  // Legacy URLs kept only to redirect older links are not screens.
  const source = readFileSync(file, 'utf8');
  if (/^\s*return <Redirect /m.test(source) && !/return <(?!Redirect)/.test(source)) continue;
  const route = `/${segments.join('/')}`;
  if (aliases.has(route)) continue;
  fileRoutes.add(route);
}

const missingFiles = [...catalogRoutes].filter((r) => !fileRoutes.has(r)).sort();
const missingEntries = [...fileRoutes].filter((r) => !catalogRoutes.has(r)).sort();
for (const r of missingFiles) console.error(`catalog route has no file under ${appDir}: ${r}`);
for (const r of missingEntries) console.error(`route file is missing from screen-catalog.ts: ${r}`);
if (missingFiles.length || missingEntries.length) process.exit(1);
console.log(`Screen catalog matches ${fileRoutes.size} routes.`);
