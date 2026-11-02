import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { walk } from './lib/files.mjs';

// Frontend modules talk to each other only through their public `index.ts`, and only "downwards":
//   shared < notifications < onboarding < auth < feature modules < foundation (the app shell).
// Fails on a deep import into another module (`@/modules/rooms/api`) or an import from a higher layer.
// `foundation/launcher/` may read each module's `module.ts` metadata. Route files in `src/app` are not checked.

const modulesDir = 'frontend/src/modules';
const layers = { shared: 0, notifications: 1, onboarding: 2, auth: 3, foundation: 5 };
const layerOf = (name) => layers[name] ?? 4; // every other folder is a feature module

const importPattern = /(?:from|import)\s*\(?\s*['"]@\/modules\/([a-z-]+)(\/[^'"]*)?['"]/g;
const errors = [];
let checked = 0;

for (const file of walk(modulesDir, (p) => /\.(tsx?|mjs)$/.test(p))) {
  const path = relative(modulesDir, file).split(sep);
  if (path.length < 2) continue; // screen-catalog.ts and other top-level files
  const owner = path[0];
  const source = readFileSync(file, 'utf8');
  for (const [, target, subpath = ''] of source.matchAll(importPattern)) {
    if (target === owner) continue;
    checked += 1;
    const where = `${file}: @/modules/${target}${subpath}`;
    const launcherMeta = subpath === '/module' && path[1] === 'launcher' && owner === 'foundation';
    if (target !== 'shared' && subpath && !launcherMeta) {
      errors.push(
        `${where} reaches into ${target}; import from '@/modules/${target}' (its index.ts)`,
      );
    }
    if (layerOf(target) > layerOf(owner)) {
      errors.push(`${where} imports a higher layer (${owner} must not depend on ${target})`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Module boundaries OK: ${checked} cross-module imports checked.`);
