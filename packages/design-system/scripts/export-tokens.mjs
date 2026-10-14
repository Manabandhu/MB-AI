// Writes dist/tokens.json so non-JS clients (SwiftUI watch, Android for Cars, TV) share the same design tokens.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Node type-stripping needs explicit extensions, so load each token file directly instead of the barrel.
const tokens = {};
for (const file of ['brand.ts', 'motion.ts', 'tokens.ts']) {
  Object.assign(tokens, await import(join(root, 'src', file)));
}
const json = Object.fromEntries(
  Object.entries(tokens).filter(([, value]) => typeof value !== 'function'),
);
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/tokens.json'), `${JSON.stringify(json, null, 2)}\n`);
console.log(`Wrote ${Object.keys(json).length} token groups to dist/tokens.json`);
