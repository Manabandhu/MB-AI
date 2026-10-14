// Fails if @manabandhu/core imports a UI runtime. Core must stay reusable by watch, car, and TV clients.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const banned =
  /from ['"](react|react-native|react-dom|expo[^'"]*|@expo\/[^'"]*|@supabase\/[^'"]*|tamagui|@tamagui\/[^'"]*)['"]/;
const offenders = readdirSync(src)
  .filter((file) => file.endsWith('.ts'))
  .filter((file) => banned.test(readFileSync(join(src, file), 'utf8')));
if (offenders.length) {
  console.error(
    `@manabandhu/core must stay platform-free. Offending files: ${offenders.join(', ')}`,
  );
  process.exit(1);
}
console.log('@manabandhu/core is platform-free.');
