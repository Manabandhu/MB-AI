import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiError,
  AuthError,
  createHttpClient,
  isLocalOrLanHost,
  parseJson,
  parseJsonOrThrow,
} from '../src/http.ts';

const json = (status, body) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

test('parseJsonOrThrow returns the body on success', async () => {
  assert.deepEqual(await parseJsonOrThrow(json(200, { id: '1' }), 'Thing'), { id: '1' });
});

test('parseJsonOrThrow prefixes the server message with the label', async () => {
  await assert.rejects(parseJsonOrThrow(json(400, { message: 'Bad city' }), 'Rooms'), {
    name: 'ApiError',
    message: 'Rooms: Bad city',
  });
  await assert.rejects(parseJsonOrThrow(json(500, ''), 'Rooms'), { message: 'Rooms failed: 500' });
});

test('parseJson surfaces raw text detail', async () => {
  await assert.rejects(parseJson(json(409, 'Already joined')), (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.message, 'Already joined');
    return true;
  });
});

test('client attaches bearer token and base url, and raises AuthError on 401', async () => {
  const calls = [];
  const client = createHttpClient({
    baseUrl: () => 'https://api.test',
    getAccessToken: async () => 'tok',
    fetchImpl: async (url, init) => {
      calls.push({ url, auth: new Headers(init.headers).get('Authorization') });
      return url.endsWith('/secret') ? json(401, 'nope') : json(200, {});
    },
  });
  await client.fetch('/api/v1/ok');
  assert.deepEqual(calls[0], { url: 'https://api.test/api/v1/ok', auth: 'Bearer tok' });
  await assert.rejects(
    client.fetch('/secret'),
    (err) => err instanceof AuthError && err.status === 401,
  );
});

test('isLocalOrLanHost recognises private hosts only', () => {
  for (const host of ['localhost', '127.0.0.1', '192.168.1.4', '10.0.0.2', '172.20.1.1']) {
    assert.equal(isLocalOrLanHost(host), true, host);
  }
  for (const host of ['api.manabandhu.app', '172.32.0.1', '8.8.8.8']) {
    assert.equal(isLocalOrLanHost(host), false, host);
  }
});
