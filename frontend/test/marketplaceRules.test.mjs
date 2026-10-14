import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONDITIONS,
  isNotFound,
  listingQuery,
  ownerStatusActions,
  parsePrice,
  shareMessage,
  statusIs,
  statusLabel,
} from '../src/modules/marketplace/utils/listingRules.ts';

test('price parsing is strict', () => {
  assert.deepEqual(parsePrice('25'), { value: 25 });
  assert.deepEqual(parsePrice(' 24.99 '), { value: 24.99 });
  assert.deepEqual(parsePrice('0'), { value: 0 });
  assert.deepEqual(parsePrice('.5'), { value: 0.5 });
  assert.deepEqual(parsePrice('99999999.99'), { value: 99_999_999.99 });
  for (const bad of ['', '12abc', 'abc', '1e3', '-5', '1,200', '12.345', '1.2.3', '$12']) {
    assert.ok('error' in parsePrice(bad), `expected "${bad}" to be rejected`);
  }
  assert.ok('error' in parsePrice('100000000'));
});

test('owner status actions follow the backend state machine', () => {
  assert.deepEqual(
    ownerStatusActions('active').map((a) => a.status),
    ['reserved', 'sold'],
  );
  assert.deepEqual(
    ownerStatusActions('RESERVED').map((a) => a.status),
    ['active', 'sold'],
  );
  assert.deepEqual(
    ownerStatusActions('sold').map((a) => a.status),
    ['active'],
  );
  // `removed` is moderator-only and cannot be undone by the owner.
  assert.deepEqual(ownerStatusActions('removed'), []);
});

test('status helpers ignore case', () => {
  assert.equal(statusIs('Sold', 'sold'), true);
  assert.equal(statusIs(null, 'active'), false);
  assert.equal(statusLabel('reserved'), 'Reserved');
});

test('listing query leaves out empty filters and caps the page size', () => {
  assert.equal(listingQuery({}, 0), 'page=0&size=24');
  assert.equal(
    listingQuery(
      { q: ' rice cooker ', condition: 'Like New', maxPrice: 0, includeClosed: true },
      2,
      500,
    ),
    'q=rice%20cooker&condition=Like%20New&maxPrice=0&includeClosed=true&page=2&size=100',
  );
});

test('conditions match the backend list', () => {
  assert.deepEqual(
    CONDITIONS.map((c) => c.id),
    ['Brand New', 'Like New', 'Gently Used', 'Fair', 'Used'],
  );
});

test('share text never prints null', () => {
  assert.equal(
    shareMessage({ title: 'Desk', priceLabel: '$40.00', location: null }),
    'Desk ($40.00) on ManaBandhu',
  );
  assert.equal(
    shareMessage({ title: 'Desk', priceLabel: 'Free', location: 'Irving, TX' }),
    'Desk (Free, Irving, TX) on ManaBandhu',
  );
});

test('only a 404 is not found', () => {
  assert.equal(isNotFound({ status: 404 }), true);
  assert.equal(isNotFound({ status: 409 }), false);
});
