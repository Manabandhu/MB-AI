// Design-system ratchet for frontend/src/modules. Each file may not get worse than scripts/design-baseline.json:
// no new hex/rgb colour literals, local colour objects, numeric width breakpoints, or icon/toolkit imports outside
// shared/ui. Run with --update after cleaning a module to lock in the lower counts (never to raise them).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const modulesDir = join(root, 'frontend/src/modules');
const baselinePath = join(root, 'scripts/design-baseline.json');

const rules = {
  colorLiteral: /['"`]#[0-9a-fA-F]{3,8}['"`]|\brgba?\(/g,
  localPalette: /^(?:export )?const (?:colors|palette|C|COLORS|theme)\s*=\s*\{/gm,
  numericBreakpoint: /\bwidth\s*(?:>=|<=|<|>)\s*\d{3,4}\b/g,
  toolkitImport:
    /from '(?:@gluestack-ui[^']*|iconoir-react-native|lucide-react-native[^']*|@tamagui\/lucide[^']*)'/g,
};
// The primitives are where raw values and icon libraries are allowed to live.
const exempt = (file) => file.startsWith('shared/ui/') || file === 'screen-catalog.ts';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const current = {};
for (const path of walk(modulesDir)) {
  const file = relative(modulesDir, path);
  if (exempt(file)) continue;
  const source = readFileSync(path, 'utf8');
  const counts = {};
  for (const [rule, pattern] of Object.entries(rules)) {
    const n = source.match(pattern)?.length ?? 0;
    if (n) counts[rule] = n;
  }
  if (Object.keys(counts).length) current[file] = counts;
}

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Wrote design baseline for ${Object.keys(current).length} files.`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const failures = [];
let improvable = 0;
for (const [file, counts] of Object.entries(current)) {
  for (const [rule, n] of Object.entries(counts)) {
    const allowed = baseline[file]?.[rule] ?? 0;
    if (n > allowed) failures.push(`${file}: ${rule} ${n} (baseline ${allowed})`);
    if (n < allowed) improvable += 1;
  }
}
for (const [file, counts] of Object.entries(baseline)) {
  for (const [rule, allowed] of Object.entries(counts)) {
    if ((current[file]?.[rule] ?? 0) < allowed) improvable += 1;
  }
}

if (failures.length) {
  console.error(
    'New design-system violations (use tokens from @manabandhu/design-system and shared/ui primitives):',
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
const total = Object.values(current).reduce(
  (sum, counts) => sum + Object.values(counts).reduce((a, b) => a + b, 0),
  0,
);
console.log(
  `Design ratchet OK: ${total} legacy violations across ${Object.keys(current).length} files` +
    (improvable ? `; ${improvable} counts dropped — run with --update to lock them in.` : '.'),
);
