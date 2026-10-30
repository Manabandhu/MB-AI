import assert from 'node:assert/strict';
import test from 'node:test';

import { createChunkedStorage } from '../src/lib/chunkedStorage.ts';

function memoryStore() {
  const map = new Map();
  return {
    map,
    getItemAsync: async (key) => (map.has(key) ? map.get(key) : null),
    setItemAsync: async (key, value) => {
      map.set(key, value);
    },
    deleteItemAsync: async (key) => {
      map.delete(key);
    },
  };
}

test('large values round-trip through several chunks', async () => {
  const store = memoryStore();
  const storage = createChunkedStorage(store, 10);
  const session = JSON.stringify({ access_token: 'a'.repeat(57), user: { id: 'u1' } });
  await storage.setItem('sb-session', session);
  assert.equal(await storage.getItem('sb-session'), session);
  assert.equal(store.map.get('sb-session'), String(Math.ceil(session.length / 10)));
  for (const value of store.map.values()) assert.ok(value.length <= 10);
});

test('overwriting with a shorter value removes stale chunks', async () => {
  const store = memoryStore();
  const storage = createChunkedStorage(store, 4);
  await storage.setItem('k', 'abcdefghijkl');
  await storage.setItem('k', 'xy');
  assert.equal(await storage.getItem('k'), 'xy');
  assert.deepEqual([...store.map.keys()].sort(), ['k', 'k.chunk0']);
});

test('removeItem deletes every chunk', async () => {
  const store = memoryStore();
  const storage = createChunkedStorage(store, 3);
  await storage.setItem('k', 'abcdefgh');
  await storage.removeItem('k');
  assert.equal(store.map.size, 0);
  assert.equal(await storage.getItem('k'), null);
});

test('sessions saved before chunking are still readable', async () => {
  const store = memoryStore();
  store.map.set('legacy', '{"access_token":"t"}');
  const storage = createChunkedStorage(store);
  assert.equal(await storage.getItem('legacy'), '{"access_token":"t"}');
});

test('a missing chunk is treated as no session', async () => {
  const store = memoryStore();
  const storage = createChunkedStorage(store, 2);
  await storage.setItem('k', 'abcdef');
  store.map.delete('k.chunk1');
  assert.equal(await storage.getItem('k'), null);
});
