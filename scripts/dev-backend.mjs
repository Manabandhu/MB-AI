import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const envPath = 'backend/.env';
const env = { ...process.env };

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const separator = trimmed.indexOf('=');
  if (separator === -1) return null;

  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();

  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) return null;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    env[key] ??= value;
  }
}

// Local runs use the hosted Supabase database directly (no local Postgres) and never migrate it: schema changes
// reach Supabase through the deployed backend's startup migration or the `migrate` workflow, not a developer laptop.
const projectRef = env.SUPABASE_PROJECT_REF ?? 'lpzaioyurvgdysdfktzc';
const pooler = env.SUPABASE_POOLER_HOST ?? 'aws-0-us-east-2.pooler.supabase.com';
// Session-mode pooler (port 5432) keeps prepared statements working for Hibernate.
env.DATABASE_URL ??= `jdbc:postgresql://${pooler}:5432/postgres?sslmode=require`;
env.DATABASE_USERNAME ??= `postgres.${projectRef}`;
env.SPRING_FLYWAY_ENABLED ??= 'false';
if (!env.DATABASE_PASSWORD || env.DATABASE_PASSWORD.startsWith('replace-with')) {
  console.error(
    `Set DATABASE_PASSWORD (Supabase → Project Settings → Database) in ${envPath} or your shell. Never commit it.`,
  );
  process.exit(1);
}
console.log(
  `Backend → Supabase ${env.DATABASE_URL.replace(/\?.*/, '')} as ${env.DATABASE_USERNAME} (migrations: ${env.SPRING_FLYWAY_ENABLED === 'true' ? 'on' : 'off'})`,
);

const child = spawn('./backend/mvnw', ['-f', 'backend/pom.xml', 'spring-boot:run'], {
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
