import assert from 'node:assert/strict';
import test from 'node:test';

async function parseJsonOrThrow(response, label) {
  if (!response.ok) throw new Error(`${label} failed: ${response.status}`);
  return response.json();
}

async function parseJson(response) {
  if (response.ok) return response.json();
  const detail = await response.text();
  throw new Error(detail || `Request failed: ${response.status}`);
}

test('parseJsonOrThrow returns parsed json on success', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({ id: '123', name: 'Test' }),
  };
  const data = await parseJsonOrThrow(mockResponse, 'TestAPI');
  assert.deepEqual(data, { id: '123', name: 'Test' });
});

test('parseJsonOrThrow throws formatted error on failure', async () => {
  const mockResponse = {
    ok: false,
    status: 404,
    json: async () => ({}),
  };
  await assert.rejects(
    async () => parseJsonOrThrow(mockResponse, 'UserFetch'),
    /UserFetch failed: 404/
  );
});

test('parseJson returns parsed json on 200', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  };
  const data = await parseJson(mockResponse);
  assert.equal(data.success, true);
});

test('parseJson throws response text on non-ok', async () => {
  const mockResponse = {
    ok: false,
    status: 400,
    text: async () => 'Invalid payload',
  };
  await assert.rejects(
    async () => parseJson(mockResponse),
    /Invalid payload/
  );
});
