import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Fails when a tracked file contains something that looks like a real credential. Two leaks were found in this
// repository (a database password in backend/.env.example and Supabase/GitHub tokens in .kilo/kilo.json); this
// keeps them from coming back. Reference secrets through environment variables instead.

const patterns = [
  ['Supabase access token', /\bsbp_[A-Za-z0-9]{20,}/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ['GitHub token', /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ['Anthropic/OpenAI key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
];

// Values that are clearly placeholders or local-only defaults.
const placeholder =
  /^(|postgres|replace[-_].*|your[-_].*|changeme|example.*|<.*>|\$\{.*\}|\{env:.*\})$/i;

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const findings = [];
for (const file of files) {
  if (
    /\.(png|jpe?g|gif|webp|ico|jar|lock|ttf|otf|woff2?)$/i.test(file) ||
    file.endsWith('pnpm-lock.yaml')
  )
    continue;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const [label, pattern] of patterns) {
      if (pattern.test(line)) findings.push(`${file}:${index + 1} ${label}`);
    }
    // Committed env files may only carry placeholders for passwords, keys, and tokens.
    const envAssignment =
      /(?:^|\/)\.env[^/]*$/.test(file) &&
      line.match(/^([A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|KEY))=(.*)$/);
    if (
      envAssignment &&
      !placeholder.test(envAssignment[2].trim()) &&
      !/PUBLISHABLE_KEY$/.test(envAssignment[1])
    ) {
      findings.push(`${file}:${index + 1} ${envAssignment[1]} has a non-placeholder value`);
    }
  });
}

if (findings.length > 0) {
  console.error('Possible committed credentials (values not shown):');
  for (const finding of findings) console.error(`  ${finding}`);
  console.error('Move the value to an environment variable or secret store, then rotate it.');
  process.exit(1);
}
console.log(`Scanned ${files.length} tracked files; no credentials found.`);
