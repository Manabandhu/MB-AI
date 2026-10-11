import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bookingBlockReason,
  contributionAmount,
  departsInWindow,
  hasLuggageSpace,
  heldSeats,
  isJoinedRide,
  rideSearchHref,
  statusTone,
  viewerSeat,
} from '../src/modules/rides/utils/rideFormat.ts';

const now = new Date(2026, 9, 11, 12, 0);
const future = new Date(2026, 9, 12, 9, 0).toISOString();
const open = {
  isDriver: false,
  isMember: false,
  status: 'active',
  seatsAvailable: 2,
  departureAt: future,
};

test('members already on the ride are not offered another booking', () => {
  assert.equal(bookingBlockReason(open, now), null);
  assert.match(bookingBlockReason({ ...open, isMember: true }, now), /already have a seat/);
  // The driver reason wins over membership (drivers are members too).
  assert.match(bookingBlockReason({ ...open, isMember: true, isDriver: true }, now), /your ride/);
});

test("the viewer's live booking is found before any request", () => {
  const bookings = [
    { id: 'b-old', userId: 'me', seatsBooked: 1, status: 'cancelled' },
    { id: 'b-live', userId: 'me', seatsBooked: 2, status: 'CONFIRMED' },
  ];
  const requests = [{ id: 'r1', riderId: 'me', seatsRequested: 1, status: 'accepted' }];
  assert.deepEqual(viewerSeat('me', bookings, requests), {
    kind: 'booking',
    id: 'b-live',
    seats: 2,
    status: 'CONFIRMED',
  });
});

test('an accepted request beats a pending one; closed requests and other riders are ignored', () => {
  const requests = [
    { id: 'r-old', riderId: 'me', seatsRequested: 1, status: 'withdrawn' },
    { id: 'r-pending', riderId: 'me', seatsRequested: 1, status: 'pending' },
    { id: 'r-accepted', riderId: 'me', seatsRequested: 2, status: 'accepted' },
    { id: 'r-other', riderId: 'someone', seatsRequested: 1, status: 'accepted' },
  ];
  assert.equal(viewerSeat('me', [], requests)?.id, 'r-accepted');
  assert.equal(viewerSeat('me', [], requests.slice(0, 2))?.id, 'r-pending');
  assert.equal(viewerSeat('me', [], requests.slice(0, 1)), null);
  assert.equal(
    viewerSeat('me', [{ id: 'b', userId: 'me', seatsBooked: 1, status: 'cancelled' }]),
    null,
  );
  assert.equal(viewerSeat(null, [], requests), null);
});

test('departure windows use local days', () => {
  const at = (d, h) => new Date(2026, 9, d, h, 0).toISOString();
  assert.equal(departsInWindow(at(11, 18), 'today', now), true);
  assert.equal(departsInWindow(at(12, 8), 'today', now), false);
  assert.equal(departsInWindow(at(12, 8), 'tomorrow', now), true);
  assert.equal(departsInWindow(at(17, 8), 'week', now), true);
  assert.equal(departsInWindow(at(19, 8), 'week', now), false);
  assert.equal(departsInWindow('not a date', 'today', now), false);
  assert.equal(departsInWindow('not a date', 'any', now), true);
});

test('luggage, held seats and status tones', () => {
  assert.equal(hasLuggageSpace('MEDIUM'), true);
  assert.equal(hasLuggageSpace('large_suitcase'), true);
  assert.equal(hasLuggageSpace('BACKPACK_ONLY'), false);
  assert.equal(hasLuggageSpace(null), false);
  assert.equal(heldSeats({ seatsTotal: 4, seatsAvailable: 1 }), 3);
  assert.equal(heldSeats({ seatsTotal: 2, seatsAvailable: 5 }), 0);
  assert.equal(statusTone('ACTIVE'), 'success');
  assert.equal(statusTone('cancelled'), 'danger');
  assert.equal(statusTone('pending'), 'warning');
  assert.equal(statusTone('completed'), 'neutral');
});

test('global search text becomes a ride search link', () => {
  assert.equal(rideSearchHref('Austin to Dallas carpool'), '/rides/search?from=Austin&to=Dallas');
  assert.equal(rideSearchHref('Irving → Downtown'), '/rides/search?from=Irving&to=Downtown');
  assert.equal(rideSearchHref('airport'), '/rides/search?to=airport');
  assert.equal(rideSearchHref('  '), '/rides/search');
});

test('rides the viewer rides on are joined, not bookmarks', () => {
  assert.equal(isJoinedRide({ isMember: true, isDriver: false }), true);
  assert.equal(isJoinedRide({ isMember: true, isDriver: true }), false);
  assert.equal(isJoinedRide({ isMember: false, isDriver: false }), false);
});

test('a ride stored as Free has a zero amount for edit fields and templates', () => {
  assert.equal(contributionAmount('Free'), 0);
  assert.equal(contributionAmount(' free '), 0);
  assert.equal(contributionAmount('Ask the driver'), null);
});
