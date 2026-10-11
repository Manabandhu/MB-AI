import assert from 'node:assert/strict';
import test from 'node:test';
import {
  greetingName,
  preferredName,
  validateNickname,
} from '../src/modules/foundation/home/greetingName.ts';

test('nickname wins over full name', () => {
  assert.equal(preferredName({ nickname: 'Sai', full_name: 'Venkata Sai Krishna' }), 'Sai');
  assert.equal(preferredName({ full_name: 'Venkata Sai Krishna' }), 'Venkata');
  assert.equal(preferredName({}), null);
  assert.equal(preferredName(null), null);
});

test('greeting name only when it fits', () => {
  assert.equal(greetingName({ full_name: 'Sai Krishna' }), 'Sai');
  assert.equal(greetingName({ full_name: 'Venkatasubramanian K' }), null);
  assert.equal(greetingName({ full_name: 'Christopher Lee' }), null);
  assert.equal(greetingName({ nickname: '  ' }), null);
});

test('nickname validation trims and bounds length', () => {
  assert.deepEqual(validateNickname('  Sai  '), { ok: true, value: 'Sai' });
  assert.deepEqual(validateNickname('S'), { ok: false, error: 'tooShort' });
  assert.deepEqual(validateNickname('x'.repeat(11)), { ok: false, error: 'tooLong' });
  assert.equal(validateNickname('x'.repeat(10)).ok, true);
});
