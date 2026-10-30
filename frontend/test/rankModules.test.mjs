import assert from 'node:assert/strict';
import test from 'node:test';
import { rankModules } from '../src/modules/foundation/launcher/rankModules.ts';

const modules = [
  { key: 'rooms', defaultRank: 1 },
  { key: 'rides', defaultRank: 2 },
  { key: 'jobs', defaultRank: 3 },
  { key: 'safety', defaultRank: 11 },
];

test('new members see the default order', () => {
  assert.deepEqual(
    rankModules(modules, {}, []).map((m) => m.key),
    ['rooms', 'rides', 'jobs', 'safety'],
  );
});

test('frequent and recent visits move a module up', () => {
  const ranked = rankModules(modules, { safety: 4 }, [{ moduleId: 'safety', timestamp: 1 }]);
  assert.equal(ranked[0].key, 'safety');
});

test('limit trims the list', () => {
  assert.equal(rankModules(modules, {}, [], 2).length, 2);
});
