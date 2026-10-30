import assert from 'node:assert/strict';
import test from 'node:test';
import {
  amountError,
  bookingBlockReason,
  contributionAmount,
  contributionLabel,
  contributionText,
  departureError,
  departureFrom,
  isNotFound,
  nextDepartureAtSameTime,
  seatsError,
  statusIs,
} from '../src/modules/rides/utils/rideFormat.ts';

test('status checks ignore case', () => {
  assert.equal(statusIs('ACTIVE', 'active'), true);
  assert.equal(statusIs('in_progress', 'IN_PROGRESS'), true);
  assert.equal(statusIs('cancelled', 'active', 'in_progress'), false);
  assert.equal(statusIs(null, 'active'), false);
});

test('contribution never shows a double dollar sign', () => {
  assert.equal(contributionLabel('$12 / seat'), '$12 / seat');
  assert.equal(contributionLabel('$$12 / seat'), '$12 / seat');
  assert.equal(contributionLabel('12.5'), '$12.50 / seat');
  assert.equal(contributionLabel('0'), 'Free');
  assert.equal(contributionLabel(null), null);
  assert.equal(contributionAmount('$8 / seat'), 8);
  assert.equal(contributionText(12), '$12 / seat');
  assert.equal(contributionText(0), 'Free');
});

test('seats must be a whole number from 1 to 8', () => {
  assert.equal(seatsError('3'), null);
  assert.equal(seatsError('0'), 'Offer at least 1 seat.');
  assert.equal(seatsError('9'), 'At most 8 seats.');
  assert.equal(seatsError('2.5'), 'Use a whole number.');
  assert.equal(seatsError(''), 'Enter the number of seats.');
  assert.equal(seatsError('abc'), 'Use a whole number.');
});

test('amounts are validated instead of becoming NaN', () => {
  assert.equal(amountError('12'), null);
  assert.equal(amountError('12.50'), null);
  assert.notEqual(amountError('abc'), null);
  assert.notEqual(amountError(''), null);
});

test('departure must be in the future', () => {
  const now = new Date(2026, 9, 11, 12, 0);
  assert.equal(
    departureError(departureFrom(0, 11, 0, now), now),
    'Departure must be in the future.',
  );
  assert.equal(departureError(departureFrom(1, 8, 0, now), now), null);
  assert.equal(departureError(null, now), 'Choose a departure date and time.');
});

test('repeat trip defaults to the original time of day on a future day', () => {
  const now = new Date(2026, 9, 11, 12, 0);
  const original = new Date(2026, 9, 1, 8, 30).toISOString();
  const next = nextDepartureAtSameTime(original, now);
  assert.equal(next.dayOffset, 1);
  assert.equal(next.hour, 8);
  assert.equal(next.minute, 30);
  assert.ok(next.date.getTime() > now.getTime());
});

test('booking is blocked with a reason for drivers and closed rides', () => {
  const now = new Date(2026, 9, 11, 12, 0);
  const future = new Date(2026, 9, 12, 9, 0).toISOString();
  const base = { isDriver: false, status: 'active', seatsAvailable: 2, departureAt: future };
  assert.equal(bookingBlockReason(base, now), null);
  assert.match(bookingBlockReason({ ...base, isDriver: true }, now), /your ride/);
  assert.match(bookingBlockReason({ ...base, seatsAvailable: 0 }, now), /full/);
  assert.match(bookingBlockReason({ ...base, status: 'CANCELLED' }, now), /cancelled/);
  assert.match(bookingBlockReason({ ...base, status: 'completed' }, now), /finished/);
  assert.match(
    bookingBlockReason({ ...base, departureAt: new Date(2026, 9, 10).toISOString() }, now),
    /departed/,
  );
});

test('only a 404 counts as not found', () => {
  assert.equal(isNotFound({ status: 404 }), true);
  assert.equal(isNotFound({ status: 500 }), false);
  assert.equal(isNotFound(undefined), false);
});
