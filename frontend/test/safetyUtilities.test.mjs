import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isUserRole,
  oldestFirst,
  safeExternalUrl,
} from '../src/modules/ai-assistant/assistantFormat.ts';
import {
  reportCategory,
  reportCategoryLabel,
  reportStatus,
  telHref,
  trustedContactErrors,
} from '../src/modules/safety/safetyFormat.ts';
import {
  formatDistance,
  mapsSearchUrl,
  matchesSearch,
  packageStatus,
  telLink,
  trackingNumberError,
} from '../src/modules/utilities/utilitiesFormat.ts';

test('report categories round-trip to readable labels', () => {
  assert.equal(reportCategory('user', 'harassment'), 'user:harassment');
  assert.equal(reportCategoryLabel('user:harassment'), 'Member: Harassment or threats');
  assert.equal(reportCategoryLabel('conversation:spam'), 'Conversation: Spam');
  assert.equal(reportCategoryLabel('Custom thing'), 'Custom thing');
  assert.equal(reportStatus('in_review').label, 'In review');
  assert.equal(reportStatus('RESOLVED').tone, 'success');
});

test('trusted contact validation needs a name and a way to reach them', () => {
  assert.deepEqual(trustedContactErrors({ name: 'Asha', phone: '+1 555 123 4567', email: '' }), {});
  assert.deepEqual(trustedContactErrors({ name: 'Asha', phone: '', email: 'a@b.co' }), {});
  assert.ok(trustedContactErrors({ name: '', phone: '5551234567', email: '' }).name);
  assert.ok(trustedContactErrors({ name: 'Asha', phone: '', email: '' }).phone);
  assert.ok(trustedContactErrors({ name: 'Asha', phone: 'call me', email: '' }).phone);
  assert.ok(trustedContactErrors({ name: 'Asha', phone: '', email: 'nope' }).email);
  assert.equal(telHref('+1 (555) 123-4567'), 'tel:+15551234567');
});

test('utilities helpers', () => {
  assert.equal(packageStatus('out_for_delivery').label, 'Out for delivery');
  assert.equal(packageStatus('DELIVERED').tone, 'success');
  assert.ok(matchesSearch('', ['x']));
  assert.ok(matchesSearch('PHAR', ['Walgreens', 'pharmacy']));
  assert.ok(!matchesSearch('zzz', ['a', null]));
  assert.equal(formatDistance(0.35), '350 m');
  assert.equal(formatDistance(1.234), '1.2 km');
  assert.equal(formatDistance(null), null);
  assert.equal(telLink(''), null);
  assert.equal(telLink('911'), 'tel:911');
  assert.match(mapsSearchUrl('1 Main St, Austin'), /query=1%20Main%20St%2C%20Austin$/);
  assert.equal(trackingNumberError('1Z999AA10123456784'), null);
  assert.ok(trackingNumberError('ab'));
  assert.ok(trackingNumberError('bad/chars!'));
});

test('assistant helpers keep oldest-first order and only open web links', () => {
  const ordered = oldestFirst([
    { id: 'b', createdAt: '2026-10-12T10:01:00Z' },
    { id: 'a', createdAt: '2026-10-12T10:00:00Z' },
  ]);
  assert.deepEqual(
    ordered.map((m) => m.id),
    ['a', 'b'],
  );
  assert.ok(isUserRole('user'));
  assert.ok(!isUserRole('ASSISTANT'));
  assert.equal(safeExternalUrl('https://uscis.gov/x'), 'https://uscis.gov/x');
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
});
