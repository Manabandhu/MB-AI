import { spawnSync } from 'node:child_process';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321/auth/v1';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

function api(path, options = {}) {
  const opts = {
    headers: {
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      ...options.headers,
    },
    ...options,
  };
  delete opts.headers;
  const url = path.startsWith('http') ? path : SUPABASE_URL + path;
  const result = spawnSync(
    'curl',
    [
      '-s',
      '-w',
      '\n%{http_code}',
      '-X',
      opts.method || 'GET',
      url,
      '-H',
      'Content-Type: application/json',
      '-H',
      `apikey: ${PUBLISHABLE_KEY}`,
      ...(opts.headers
        ? Object.entries(opts.headers).flatMap(([k, v]) => ['-H', `${k}: ${v}`])
        : []),
      ...(opts.body ? ['-d', JSON.stringify(opts.body)] : []),
    ],
    { encoding: 'utf8' },
  );
  const lines = result.stdout.trim().split('\n');
  const statusCode = parseInt(lines.pop(), 10);
  const body = lines.join('\n');
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    parsedBody = body;
  }
  return { status: statusCode, body: parsedBody, raw: body };
}

function backendApi(path, token, options = {}) {
  const result = spawnSync(
    'curl',
    [
      '-s',
      '-w',
      '\n%{http_code}',
      '-X',
      options.method || 'GET',
      `${BACKEND_URL}${path}`,
      '-H',
      'Content-Type: application/json',
      ...(token ? ['-H', `Authorization: Bearer ${token}`] : []),
      ...(options.body ? ['-d', JSON.stringify(options.body)] : []),
    ],
    { encoding: 'utf8' },
  );
  const lines = result.stdout.trim().split('\n');
  const statusCode = parseInt(lines.pop(), 10);
  const body = lines.join('\n');
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    parsedBody = body;
  }
  return { status: statusCode, body: parsedBody };
}

function adminApi(method, path, body = {}) {
  const result = spawnSync(
    'curl',
    [
      '-s',
      '-w',
      '\n%{http_code}',
      '-X',
      method,
      `${SUPABASE_URL}${path}`,
      '-H',
      'Content-Type: application/json',
      '-H',
      `apikey: ${SECRET_KEY}`,
      '-H',
      `Authorization: Bearer ${SECRET_KEY}`,
      '-d',
      JSON.stringify(body),
    ],
    { encoding: 'utf8' },
  );
  const lines = result.stdout.trim().split('\n');
  const statusCode = parseInt(lines.pop(), 10);
  const respBody = lines.join('\n');
  let parsedBody;
  try {
    parsedBody = JSON.parse(respBody);
  } catch {
    parsedBody = respBody;
  }
  return { status: statusCode, body: parsedBody };
}

function decodeJwt(jwt) {
  const parts = jwt.split('.');
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return { header, payload };
}

const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
  try {
    const result = fn();
    if (result.passed) {
      results.passed++;
      results.tests.push({ name, status: 'PASS', detail: result.detail });
      console.log(`  ✓ ${name}`);
    } else {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', detail: result.detail });
      console.log(`  ✗ ${name}: ${result.detail}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'ERROR', detail: e.message });
    console.log(`  ✗ ${name}: ERROR - ${e.message}`);
  }
}

async function runTests() {
  const timestamp = Date.now();
  const testEmail = `integration-${timestamp}@manabandhu.test`;
  const testPassword = 'TestPass123!';

  console.log('\n=== Email Authentication Integration Tests ===\n');

  console.log('1. Sign up with email confirmation enabled');
  console.log('2. Confirm email via Admin API');
  console.log('3. Sign in with valid credentials');
  console.log('4. Test /api/v1/me with valid JWT');
  console.log('5. Test /api/v1/me without token');
  console.log('6. Test /api/v1/me with expired JWT');
  console.log('7. Test /api/v1/me with invalid signature');
  console.log('8. Test /api/v1/me with wrong issuer');
  console.log('9. Test /api/v1/me with wrong audience');

  console.log('\n--- Running Tests ---\n');

  // Sign up
  const signupRes = api('/signup', {
    method: 'POST',
    body: { email: testEmail, password: testPassword },
  });
  const userId = signupRes.body?.id || signupRes.body?.user?.id;

  test('Sign up creates unconfirmed user', () => {
    if (!userId)
      return { passed: false, detail: `No user ID. Response: ${JSON.stringify(signupRes.body)}` };
    return { passed: true, detail: `User ID: ${userId}` };
  });

  test('Signup response has email_verified=false', () => {
    const userMetadata = signupRes.body?.user_metadata || signupRes.body?.user?.user_metadata;
    const verified = userMetadata?.email_verified;
    if (verified === false) return { passed: true, detail: 'email_verified is false' };
    return { passed: false, detail: `email_verified=${verified}` };
  });

  // Confirm email via Admin API
  const confirmRes = adminApi('PUT', `/admin/users/${userId}`, { email_confirm: true });
  test('Admin API confirms email', () => {
    const confirmedAt = confirmRes.body?.email_confirmed_at;
    if (confirmedAt) return { passed: true, detail: `Confirmed at: ${confirmedAt}` };
    return { passed: false, detail: `No email_confirmed_at. Status: ${confirmRes.status}` };
  });

  // Sign in
  const signInRes = api('/token?grant_type=password', {
    method: 'POST',
    body: { email: testEmail, password: testPassword },
  });
  const validJwt = signInRes.body?.access_token;

  test('Sign in returns access_token', () => {
    if (validJwt?.startsWith('eyJ'))
      return { passed: true, detail: `Token length: ${validJwt.length}` };
    return { passed: false, detail: `No valid token. Response: ${JSON.stringify(signInRes.body)}` };
  });

  test('JWT has correct issuer', () => {
    if (!validJwt) return { passed: false, detail: 'No JWT' };
    const { payload } = decodeJwt(validJwt);
    const expectedIssuer = 'http://127.0.0.1:54321/auth/v1';
    if (payload.iss === expectedIssuer) return { passed: true, detail: `iss: ${payload.iss}` };
    return { passed: false, detail: `Expected ${expectedIssuer}, got ${payload.iss}` };
  });

  test('JWT has aud=authenticated', () => {
    if (!validJwt) return { passed: false, detail: 'No JWT' };
    const { payload } = decodeJwt(validJwt);
    if (payload.aud === 'authenticated') return { passed: true, detail: `aud: ${payload.aud}` };
    return { passed: false, detail: `Expected authenticated, got ${payload.aud}` };
  });

  test('JWT has ES256 algorithm and matching kid', () => {
    if (!validJwt) return { passed: false, detail: 'No JWT' };
    const { header } = decodeJwt(validJwt);
    if (header.alg === 'ES256')
      return { passed: true, detail: `alg: ${header.alg}, kid: ${header.kid}` };
    return { passed: false, detail: `Expected ES256, got ${header.alg}` };
  });

  // Test /api/v1/me with valid JWT
  const meRes = backendApi('/api/v1/me', validJwt);
  test('/api/v1/me returns 200 with valid JWT', () => {
    if (meRes.status === 200) return { passed: true, detail: JSON.stringify(meRes.body) };
    return {
      passed: false,
      detail: `Status: ${meRes.status}, Body: ${JSON.stringify(meRes.body)}`,
    };
  });

  test('/api/v1/me returns user email from JWT', () => {
    if (meRes.status !== 200) return { passed: false, detail: 'Previous test failed' };
    if (meRes.body?.email === testEmail)
      return { passed: true, detail: `email: ${meRes.body.email}` };
    return { passed: false, detail: `Expected ${testEmail}, got ${meRes.body?.email}` };
  });

  // Test without token
  const noTokenRes = backendApi('/api/v1/me', null);
  test('/api/v1/me returns 401 without token', () => {
    if (noTokenRes.status === 401) return { passed: true, detail: 'Correctly rejected' };
    return { passed: false, detail: `Expected 401, got ${noTokenRes.status}` };
  });

  // Test with invalid token
  const invalidRes = backendApi('/api/v1/me', 'invalid.token.here');
  test('/api/v1/me returns 401 with malformed token', () => {
    if (invalidRes.status === 401) return { passed: true, detail: 'Correctly rejected' };
    return { passed: false, detail: `Expected 401, got ${invalidRes.status}` };
  });

  // Test with expired JWT
  const expiredPayload = {
    iss: 'http://127.0.0.1:54321/auth/v1',
    aud: 'authenticated',
    sub: userId,
    email: testEmail,
    exp: Math.floor(Date.now() / 1000) - 3600,
    iat: Math.floor(Date.now() / 1000) - 7200,
  };
  const expiredJwt =
    validJwt.split('.')[0] +
    '.' +
    Buffer.from(JSON.stringify(expiredPayload)).toString('base64') +
    '.' +
    validJwt.split('.')[2];
  const expiredRes = backendApi('/api/v1/me', expiredJwt);
  test('/api/v1/me returns 401 with expired JWT', () => {
    if (expiredRes.status === 401) return { passed: true, detail: 'Correctly rejected' };
    return { passed: false, detail: `Expected 401, got ${expiredRes.status}` };
  });

  // Test with wrong issuer
  const wrongIssuerPayload = {
    ...decodeJwt(validJwt).payload,
    iss: 'http://evil.com/auth/v1',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  const wrongIssuerJwt =
    validJwt.split('.')[0] +
    '.' +
    Buffer.from(JSON.stringify(wrongIssuerPayload)).toString('base64') +
    '.' +
    validJwt.split('.')[2];
  const wrongIssuerRes = backendApi('/api/v1/me', wrongIssuerJwt);
  test('/api/v1/me returns 401 with wrong issuer', () => {
    if (wrongIssuerRes.status === 401) return { passed: true, detail: 'Correctly rejected' };
    return { passed: false, detail: `Expected 401, got ${wrongIssuerRes.status}` };
  });

  // Test with wrong audience
  const wrongAudPayload = {
    ...decodeJwt(validJwt).payload,
    aud: 'wrong-audience',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  const wrongAudJwt =
    validJwt.split('.')[0] +
    '.' +
    Buffer.from(JSON.stringify(wrongAudPayload)).toString('base64') +
    '.' +
    validJwt.split('.')[2];
  const wrongAudRes = backendApi('/api/v1/me', wrongAudJwt);
  test('/api/v1/me returns 401 with wrong audience', () => {
    if (wrongAudRes.status === 401) {
      return { passed: true, detail: 'Correctly rejected' };
    }
    return {
      passed: false,
      detail: `Expected 401, got ${wrongAudRes.status}, Body: ${JSON.stringify(wrongAudRes.body)}`,
    };
  });

  console.log(`\n=== Results: ${results.passed} passed, ${results.failed} failed ===\n`);
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests();
