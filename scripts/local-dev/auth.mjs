// Local-only auth for running the backend without Supabase: an ES256 signing key, a JWKS endpoint the backend
// trusts via SUPABASE_JWKS_URI, and a token minter. Keys live in .local-dev/ (git-ignored) and are never valid
// against a real Supabase project.
//
//   node scripts/local-dev/auth.mjs serve                 # JWKS on http://localhost:9999/jwks.json
//   node scripts/local-dev/auth.mjs mint <user-uuid> [ROLE...]   # prints a bearer token (e.g. ADMIN, SUPER_ADMIN)

import { createPrivateKey, generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const keyFile = join(root, '.local-dev', 'jwt-signing-key.pem');
export const ISSUER = 'http://localhost:9999/auth/v1';
export const JWKS_PORT = 9999;

function signingKey() {
  if (!existsSync(keyFile)) {
    mkdirSync(dirname(keyFile), { recursive: true });
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    writeFileSync(keyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  }
  return createPrivateKey(readFileSync(keyFile));
}

export function jwks() {
  const { kty, crv, x, y } = signingKey().export({ format: 'jwk' });
  return { keys: [{ kty, crv, x, y, kid: 'local', alg: 'ES256', use: 'sig' }] };
}

const b64url = (value) => Buffer.from(value).toString('base64url');

/** Mints a Supabase-shaped access token for a local user id, valid for two hours. */
export function mint(userId, roles = []) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', typ: 'JWT', kid: 'local' };
  const payload = {
    sub: userId,
    aud: 'authenticated',
    iss: ISSUER,
    iat: now,
    exp: now + 7200,
    role: 'authenticated',
    email: `${userId.slice(0, 8)}@example.test`,
    app_metadata: { roles },
    user_metadata: { full_name: `Test ${userId.slice(0, 4)}` },
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: signingKey(),
    dsaEncoding: 'ieee-p1363',
  });
  return `${unsigned}.${signature.toString('base64url')}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, userId, ...roles] = process.argv.slice(2);
  if (command === 'serve') {
    const body = JSON.stringify(jwks());
    createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    }).listen(JWKS_PORT, '127.0.0.1', () =>
      console.log(`JWKS at http://localhost:${JWKS_PORT}/jwks.json`),
    );
  } else if (command === 'mint' && userId) {
    console.log(mint(userId, roles));
  } else {
    console.error('Usage: auth.mjs serve | auth.mjs mint <user-uuid> [ROLE...]');
    process.exit(1);
  }
}
