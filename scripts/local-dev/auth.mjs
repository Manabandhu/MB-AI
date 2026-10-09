// Local-only auth for running the app without Supabase: an ES256 signing key, a JWKS endpoint the backend trusts via
// SUPABASE_JWKS_URI, a token minter, and a minimal stand-in for the Supabase Auth (GoTrue) endpoints the app uses
// (password sign-up/sign-in, phone OTP, recovery, OAuth redirect, refresh, user, logout). Keys and accounts live in
// .local-dev/ (git-ignored) and are never valid against a real Supabase project. Phone codes are random and are
// written to the server log (.local-dev/jwks.log) instead of being sent by SMS.
//
//   node scripts/local-dev/auth.mjs serve                 # http://localhost:9999 (JWKS + /auth/v1/*)
//   node scripts/local-dev/auth.mjs mint <user-uuid> [ROLE...]   # prints a bearer token (e.g. ADMIN, SUPER_ADMIN)

import { execFileSync } from 'node:child_process';
import {
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  sign,
  timingSafeEqual,
} from 'node:crypto';
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

/**
 * Mints a Supabase-shaped access token for a local user id, valid for two hours. `claims` overrides payload fields
 * (e.g. `exp`, `iss`, `aud`) so smoke tests can prove the backend rejects malformed tokens.
 */
export function mint(userId, roles = [], profile = {}, claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', typ: 'JWT', kid: 'local' };
  const payload = {
    sub: userId,
    aud: 'authenticated',
    iss: ISSUER,
    iat: now,
    exp: now + 7200,
    role: 'authenticated',
    email: profile.email ?? `${userId.slice(0, 8)}@example.test`,
    phone: profile.phone ?? '',
    app_metadata: { roles },
    user_metadata: profile.metadata ?? { full_name: `Test ${userId.slice(0, 4)}` },
    ...claims,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: signingKey(),
    dsaEncoding: 'ieee-p1363',
  });
  return `${unsigned}.${signature.toString('base64url')}`;
}

// --- Supabase Auth stand-in ------------------------------------------------------------------------------------

const usersFile = join(root, '.local-dev', 'auth-users.json');
const loadUsers = () => (existsSync(usersFile) ? JSON.parse(readFileSync(usersFile, 'utf8')) : []);
const saveUsers = (users) =>
  writeFileSync(usersFile, JSON.stringify(users, null, 2), { mode: 0o600 });
const refreshTokens = new Map();
const phoneCodes = new Map();

function hashPassword(password) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(password, salt, 32).toString('hex')}`;
}

function passwordMatches(stored, password) {
  const [salt, hash] = (stored ?? '').split(':');
  if (!salt || !hash) return false;
  return timingSafeEqual(
    Buffer.from(hash, 'hex'),
    scryptSync(password, Buffer.from(salt, 'hex'), 32),
  );
}

/** Mirrors a new account into the local database so foreign keys to auth.users hold. */
function persistToDatabase(user) {
  // psql only interpolates :'variables' in scripts read from stdin, which also keeps values out of the SQL text.
  const sql =
    "insert into auth.users (id, email, raw_user_meta_data) values (:'id', nullif(:'email', ''), :'meta'::jsonb) on conflict (id) do nothing;";
  try {
    execFileSync(
      'psql',
      [
        '-d',
        process.env.LOCAL_DB ?? 'manabandhu',
        '-q',
        '-v',
        'ON_ERROR_STOP=1',
        '-v',
        `id=${user.id}`,
        '-v',
        `email=${user.email ?? ''}`,
        '-v',
        `meta=${JSON.stringify(user.metadata ?? {})}`,
      ],
      {
        input: sql,
        env: { PGHOST: 'localhost', PGUSER: 'postgres', PGPASSWORD: 'postgres', ...process.env },
        stdio: ['pipe', 'ignore', 'ignore'],
      },
    );
  } catch {
    console.warn(`Could not mirror user ${user.id} into auth.users`);
  }
}

function publicUser(user) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email ?? '',
    phone: user.phone ?? '',
    email_confirmed_at: user.email ? user.createdAt : null,
    phone_confirmed_at: user.phone ? user.createdAt : null,
    app_metadata: {
      provider: user.provider ?? 'email',
      providers: [user.provider ?? 'email'],
      roles: [],
    },
    user_metadata: user.metadata ?? {},
    identities: [],
    created_at: user.createdAt,
    updated_at: now,
  };
}

function sessionFor(user) {
  const refreshToken = randomBytes(24).toString('base64url');
  refreshTokens.set(refreshToken, user.id);
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: mint(user.id, [], {
      email: user.email,
      phone: user.phone,
      metadata: user.metadata,
    }),
    token_type: 'bearer',
    expires_in: 7200,
    expires_at: now + 7200,
    refresh_token: refreshToken,
    user: publicUser(user),
  };
}

function createUser(fields) {
  const users = loadUsers();
  const user = { id: randomUUID(), createdAt: new Date().toISOString(), metadata: {}, ...fields };
  users.push(user);
  saveUsers(users);
  persistToDatabase(user);
  return user;
}

function userFromBearer(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /i, '');
  try {
    const { sub } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return loadUsers().find((u) => u.id === sub) ?? null;
  } catch {
    return null;
  }
}

const authError = (status, code, message) => ({
  status,
  body: { code: status, error_code: code, msg: message },
});

async function handleAuth(req, url, body) {
  const users = loadUsers();
  const path = url.pathname.replace('/auth/v1', '');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
  if (req.method === 'GET' && path === '/health')
    return { status: 200, body: { name: 'local-auth' } };
  if (req.method === 'GET' && path === '/settings') {
    return {
      status: 200,
      body: {
        external: { email: true, phone: true, apple: true, google: true },
        mailer_autoconfirm: true,
      },
    };
  }
  if (req.method === 'POST' && path === '/signup') {
    if (!email || !body.password)
      return authError(400, 'validation_failed', 'Email and password are required');
    if (body.password.length < 8)
      return authError(422, 'weak_password', 'Password should be at least 8 characters.');
    if (users.some((u) => u.email === email))
      return authError(422, 'user_already_exists', 'User already registered');
    const user = createUser({
      email,
      passwordHash: hashPassword(body.password),
      metadata: body.data ?? {},
    });
    return { status: 200, body: sessionFor(user) };
  }
  if (req.method === 'POST' && path === '/token') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const user = users.find((u) => u.email === email);
      if (!user || !passwordMatches(user.passwordHash, body.password ?? '')) {
        return authError(400, 'invalid_credentials', 'Invalid login credentials');
      }
      return { status: 200, body: sessionFor(user) };
    }
    if (grant === 'refresh_token') {
      const userId = refreshTokens.get(body.refresh_token);
      const user = users.find((u) => u.id === userId);
      if (!user) return authError(400, 'refresh_token_not_found', 'Invalid Refresh Token');
      refreshTokens.delete(body.refresh_token);
      return { status: 200, body: sessionFor(user) };
    }
  }
  if (req.method === 'POST' && path === '/otp') {
    if (!body.phone) return authError(400, 'validation_failed', 'Phone is required');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    phoneCodes.set(body.phone, { code, expires: Date.now() + 10 * 60_000 });
    console.log(`OTP for ${body.phone}: ${code}`);
    return { status: 200, body: {} };
  }
  if (req.method === 'POST' && path === '/verify') {
    const pending = phoneCodes.get(body.phone);
    if (!pending || pending.expires < Date.now() || pending.code !== body.token) {
      return authError(403, 'otp_expired', 'Token has expired or is invalid');
    }
    phoneCodes.delete(body.phone);
    const user =
      users.find((u) => u.phone === body.phone) ??
      createUser({ phone: body.phone, provider: 'phone' });
    return { status: 200, body: sessionFor(user) };
  }
  if (req.method === 'POST' && path === '/recover') {
    if (email) console.log(`Password recovery requested for ${email}`);
    return { status: 200, body: {} };
  }
  if (req.method === 'GET' && path === '/authorize') {
    const provider = url.searchParams.get('provider') ?? 'oauth';
    const redirectTo = url.searchParams.get('redirect_to') ?? 'http://localhost:8081/auth/callback';
    const oauthEmail = `${provider}-user@example.test`;
    const user =
      users.find((u) => u.email === oauthEmail) ??
      createUser({ email: oauthEmail, provider, metadata: { full_name: `${provider} user` } });
    const session = sessionFor(user);
    const fragment = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: String(session.expires_in),
      expires_at: String(session.expires_at),
      token_type: 'bearer',
    });
    return { status: 302, headers: { Location: `${redirectTo}#${fragment}` }, body: null };
  }
  if (path === '/user') {
    const user = userFromBearer(req);
    if (!user) return authError(401, 'no_authorization', 'Invalid token');
    if (req.method === 'PUT') {
      const all = loadUsers();
      const stored = all.find((u) => u.id === user.id);
      if (body.password) stored.passwordHash = hashPassword(body.password);
      if (body.data) stored.metadata = { ...stored.metadata, ...body.data };
      saveUsers(all);
      return { status: 200, body: publicUser(stored) };
    }
    return { status: 200, body: publicUser(user) };
  }
  if (req.method === 'POST' && path === '/logout') return { status: 204, body: null };
  return authError(404, 'not_found', `Local auth does not implement ${req.method} ${path}`);
}

function serve() {
  const jwksBody = JSON.stringify(jwks());
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };
  createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${JWKS_PORT}`);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    if (url.pathname === '/jwks.json' || url.pathname === '/auth/v1/.well-known/jwks.json') {
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      res.end(jwksBody);
      return;
    }
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', async () => {
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        body = {};
      }
      const result = await handleAuth(req, url, body);
      res.writeHead(result.status, {
        ...cors,
        'Content-Type': 'application/json',
        ...(result.headers ?? {}),
      });
      res.end(result.body === null ? undefined : JSON.stringify(result.body));
    });
  }).listen(JWKS_PORT, '127.0.0.1', () =>
    console.log(`Local auth at http://localhost:${JWKS_PORT}`),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, userId, ...roles] = process.argv.slice(2);
  if (command === 'serve') {
    serve();
  } else if (command === 'mint' && userId) {
    console.log(mint(userId, roles));
  } else {
    console.error('Usage: auth.mjs serve | auth.mjs mint <user-uuid> [ROLE...]');
    process.exit(1);
  }
}
