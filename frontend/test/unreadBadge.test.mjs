import assert from 'node:assert/strict';
import test from 'node:test';
import {
  badgeText,
  totalUnread,
} from '../src/modules/foundation/shell/navigation/unreadBadge.ts';

test('totalUnread sums real counts and ignores missing or invalid ones', () => {
  assert.equal(totalUnread([]), 0);
  assert.equal(totalUnread([{ unreadCount: 2 }, {}, { unreadCount: null }, { unreadCount: 3 }]), 5);
  assert.equal(totalUnread([{ unreadCount: -4 }, { unreadCount: Number.NaN }, { unreadCount: 1 }]), 1);
});

test('badgeText hides zero and unknown counts and caps at 99+', () => {
  assert.equal(badgeText(undefined), null);
  assert.equal(badgeText(0), null);
  assert.equal(badgeText(1), '1');
  assert.equal(badgeText(99), '99');
  assert.equal(badgeText(100), '99+');
  assert.equal(badgeText(4321), '99+');
});
