import assert from 'node:assert/strict';
import test from 'node:test';
import { latestServerMessageId, withUnreadCount } from '../src/modules/chat/readState.ts';

test('latestServerMessageId picks the newest stored message and skips optimistic ones', () => {
  assert.equal(latestServerMessageId([]), undefined);
  assert.equal(
    latestServerMessageId([
      { id: 'a', createdAt: '2026-10-12T10:00:00Z' },
      { id: 'c', createdAt: '2026-10-12T10:02:00Z' },
      { id: 'b', createdAt: '2026-10-12T10:01:00Z' },
      { id: 'temp-1', createdAt: '2026-10-12T10:05:00Z' },
      { id: 'bad', createdAt: 'not a date' },
    ]),
    'c',
  );
  assert.equal(latestServerMessageId([{ id: 'temp-2', createdAt: '2026-10-12T10:00:00Z' }]), undefined);
});

test('withUnreadCount updates only the read conversation and leaves an empty cache alone', () => {
  assert.equal(withUnreadCount(undefined, 'x', 0), undefined);
  const before = [
    { id: 'x', unreadCount: 3, title: 'X' },
    { id: 'y', unreadCount: 2 },
  ];
  const after = withUnreadCount(before, 'x', 0);
  assert.deepEqual(after, [
    { id: 'x', unreadCount: 0, title: 'X' },
    { id: 'y', unreadCount: 2 },
  ]);
  assert.equal(before[0].unreadCount, 3);
});
