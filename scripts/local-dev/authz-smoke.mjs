// End-to-end authorization checks against a running backend (start it with scripts/local-dev/start.sh).
// Each run creates fresh rides/groups/referrals, so it can be repeated without resetting the database.
// Exit code is non-zero when any check fails.
//
//   node scripts/local-dev/authz-smoke.mjs [--base http://localhost:8080]

import { mint } from './auth.mjs';

const base = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:8080';
const A = '11111111-1111-1111-1111-111111111111'; // driver / group owner
const B = '22222222-2222-2222-2222-222222222222'; // rider / group member
const C = '33333333-3333-3333-3333-333333333333'; // stranger
const D = '44444444-4444-4444-4444-444444444444'; // admin
const E = '55555555-5555-5555-5555-555555555555'; // rider with verified gender (app_metadata.gender = female)
const token = {
  A: mint(A),
  B: mint(B),
  C: mint(C),
  D: mint(D, ['ADMIN']),
  E: mint(E, [], {}, { app_metadata: { roles: [], gender: 'female' } }),
};

let pass = 0;
let fail = 0;
let skip = 0;

async function call(who, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (who) headers.Authorization = `Bearer ${token[who]}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

function expect(label, actual, wanted) {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — wanted ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`}`,
  );
}

const status = async (label, wanted, who, method, path, body) => {
  const res = await call(who, method, path, body);
  expect(label, res.status, wanted);
  return res.body;
};

console.log('== public vs protected');
await status('health is public', 200, null, 'GET', '/api/v1/health');
await status('anonymous cannot read safety reports', 401, null, 'GET', '/api/v1/safety/reports');
await status(
  'anonymous cannot change notification settings',
  401,
  null,
  'PATCH',
  '/api/v1/notifications/settings',
  { preferences: { push: false } },
);
await status(
  'anonymous cannot read the notification inbox',
  401,
  null,
  'GET',
  '/api/v1/notifications/inbox',
);
await status('anonymous cannot list referrals', 401, null, 'GET', '/api/v1/referrals');
await status('public referral list is open', 200, null, 'GET', '/api/v1/referrals/public');
await status('onboarding config is public', 200, null, 'GET', '/api/v1/onboarding/config');
await status('onboarding progress needs login', 401, null, 'GET', '/api/v1/onboarding/progress');
await status('actuator metrics need admin', 401, null, 'GET', '/actuator/metrics');
await status('graphql needs login', 401, null, 'POST', '/graphql', {
  query: '{ rideOffers { id } }',
});

console.log('== immigration');
await status('immigration guides are public', 200, null, 'GET', '/api/v1/immigration/guides');
await status('immigration news is public', 200, null, 'GET', '/api/v1/immigration/news');
await status(
  'anonymous cannot list checklists',
  401,
  null,
  'GET',
  '/api/v1/immigration/checklists',
);
{
  const lists = await call('C', 'GET', '/api/v1/immigration/checklists');
  expect(
    'checklists list only the caller',
    lists.status === 200 && Array.isArray(lists.body) && lists.body.every((c) => c.ownerId === C),
    true,
  );
}
{
  await call('C', 'POST', '/api/v1/immigration/resources', {
    title: 'Unreviewed tip',
    description: 'x',
    category: 'OPT',
    url: 'https://example.test',
    resourceType: 'LINK',
  });
  const publicList = (await call(null, 'GET', '/api/v1/immigration/resources')).body ?? [];
  expect(
    'public resources never expose submitter ids',
    publicList.every((r) => !('ownerId' in r)),
    true,
  );
  expect(
    'unreviewed submissions are not public',
    publicList.every((r) => r.verified === true),
    true,
  );
}
await status('unknown resource type is a 400', 400, 'A', 'POST', '/api/v1/immigration/resources', {
  title: 'Bad type',
  description: 'x',
  category: 'OPT',
  url: 'https://www.uscis.gov',
  resourceType: 'NOT_A_TYPE',
});

console.log('== events');
await status('anonymous cannot list saved events', 401, null, 'GET', '/api/v1/events/saved');
await status('bad event dates are a 400', 400, 'A', 'POST', '/api/v1/events', {
  categoryId: '00000000-0000-0000-0000-000000000000',
  title: 'Bad date',
  location: 'Irving',
  startAt: 'next tuesday',
  endAt: 'later',
});
{
  const startAt = new Date(Date.now() + 3 * 86400000).toISOString();
  const endAt = new Date(Date.now() + 3 * 86400000 + 3600000).toISOString();
  const eventCategories = (await call(null, 'GET', '/api/v1/events/categories')).body ?? [];
  const event = await status('organizer creates an event', 201, 'A', 'POST', '/api/v1/events', {
    categoryId: eventCategories[0]?.id,
    title: 'Smoke meetup',
    location: 'Irving',
    startAt,
    endAt,
  });
  await status('member RSVPs', 201, 'B', 'POST', `/api/v1/events/${event?.id}/attendance`, {
    status: 'GOING',
  });
  await status(
    'unknown RSVP status is a 400',
    400,
    'B',
    'POST',
    `/api/v1/events/${event?.id}/attendance`,
    {
      status: 'organizer',
    },
  );
  const savedB = (await call('B', 'GET', '/api/v1/events/saved')).body ?? [];
  const savedC = (await call('C', 'GET', '/api/v1/events/saved')).body ?? [];
  expect(
    'RSVPed event is on the member saved list',
    savedB.some((e) => e.id === event?.id),
    true,
  );
  expect(
    "saved list never shows another member's events",
    savedC.some((e) => e.id === event?.id),
    false,
  );
}

console.log('== rides');
const departureAt = new Date(Date.now() + 2 * 86400000).toISOString();
const offer = await status('driver creates offer', 201, 'A', 'POST', '/api/v1/rides/offers', {
  originArea: 'Irving',
  destinationArea: 'DFW Airport',
  departureAt,
  seatsTotal: 3,
  contribution: '$10',
});
const rideId = offer?.id;
expect('offer stored as active', offer?.status, 'active');
const seats = async () =>
  (await call(null, 'GET', `/api/v1/rides/offers/${rideId}`)).body?.seatsAvailable;
await status(
  'driver cannot book own ride',
  409,
  'A',
  'POST',
  `/api/v1/rides/offers/${rideId}/bookings`,
  { seatsBooked: 1 },
);
const booking = await status(
  'rider books 2 seats',
  201,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/bookings`,
  { seatsBooked: 2 },
);
await status(
  'duplicate booking rejected',
  409,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/bookings`,
  { seatsBooked: 1 },
);
expect('seats after booking', await seats(), 1);
await status('rider cancels', 200, 'B', 'PATCH', `/api/v1/rides/bookings/${booking?.id}/status`, {
  status: 'cancelled',
});
expect('seats released on cancel', await seats(), 3);
await status(
  'cancelled booking cannot be reopened',
  409,
  'B',
  'PATCH',
  `/api/v1/rides/bookings/${booking?.id}/status`,
  { status: 'confirmed' },
);
await status(
  'unknown booking status rejected',
  400,
  'B',
  'PATCH',
  `/api/v1/rides/bookings/${booking?.id}/status`,
  { status: 'hacked' },
);
const booking2 = await status(
  'rider books again',
  201,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/bookings`,
  { seatsBooked: 1 },
);
const request = await status(
  'second rider requests a seat with a note',
  201,
  'E',
  'POST',
  `/api/v1/rides/offers/${rideId}/requests`,
  { seatsRequested: 1, message: 'call me' },
);
await status(
  'anonymous cannot read requests',
  401,
  null,
  'GET',
  `/api/v1/rides/offers/${rideId}/requests`,
);
expect(
  'stranger sees no requests',
  (await call('C', 'GET', `/api/v1/rides/offers/${rideId}/requests`)).body?.length,
  0,
);
expect(
  'driver sees the request',
  (await call('A', 'GET', `/api/v1/rides/offers/${rideId}/requests`)).body?.length,
  1,
);
await status(
  'rider cannot accept own request',
  403,
  'E',
  'PATCH',
  `/api/v1/rides/requests/${request?.id}/status`,
  { status: 'accepted' },
);
await status('driver accepts', 200, 'A', 'PATCH', `/api/v1/rides/requests/${request?.id}/status`, {
  status: 'ACCEPTED',
});
expect('accepting reserves the requested seat', await seats(), 1);
await status(
  'an accepted request cannot be deleted around the seat count',
  409,
  'E',
  'DELETE',
  `/api/v1/rides/requests/${request?.id}`,
);
await status(
  'a rider with an accepted request cannot request again',
  409,
  'E',
  'POST',
  `/api/v1/rides/offers/${rideId}/requests`,
  { seatsRequested: 1 },
);
expect(
  'accepted rider becomes a participant',
  (await call('E', 'GET', `/api/v1/rides/offers/${rideId}/participants`)).status,
  200,
);
await status(
  'accepted request cannot go back to pending',
  409,
  'A',
  'PATCH',
  `/api/v1/rides/requests/${request?.id}/status`,
  { status: 'pending' },
);
{
  const big = await call('C', 'POST', `/api/v1/rides/offers/${rideId}/requests`, {
    seatsRequested: 2,
  });
  await status(
    'accepting more seats than remain is rejected',
    409,
    'A',
    'PATCH',
    `/api/v1/rides/requests/${big.body?.id}/status`,
    { status: 'accepted' },
  );
  expect('seats unchanged after a rejected accept', await seats(), 1);
}
const womenOnly = await status(
  'driver creates a women-only offer',
  201,
  'A',
  'POST',
  '/api/v1/rides/offers',
  {
    originArea: 'Irving',
    destinationArea: 'Frisco',
    departureAt,
    seatsTotal: 2,
    contribution: '$8',
    genderPreference: 'FEMALE_ONLY',
  },
);
await status(
  'unverified rider cannot book a women-only ride',
  403,
  'B',
  'POST',
  `/api/v1/rides/offers/${womenOnly?.id}/bookings`,
  { seatsBooked: 1 },
);
await status(
  'unverified rider cannot request a women-only ride',
  403,
  'B',
  'POST',
  `/api/v1/rides/offers/${womenOnly?.id}/requests`,
  { seatsRequested: 1 },
);
await status(
  'verified woman books a women-only ride',
  201,
  'E',
  'POST',
  `/api/v1/rides/offers/${womenOnly?.id}/bookings`,
  { seatsBooked: 1 },
);
await status(
  'stranger cannot read a booking',
  403,
  'C',
  'GET',
  `/api/v1/rides/bookings/${booking2?.id}`,
);
await status(
  'stranger cannot join ride chat',
  403,
  'C',
  'POST',
  `/api/v1/rides/offers/${rideId}/chat`,
);
await status(
  'stranger cannot self-add as driver',
  403,
  'C',
  'POST',
  `/api/v1/rides/offers/${rideId}/participants?role=driver`,
);
const participant = await status(
  'passenger joins',
  201,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/participants?role=driver`,
);
expect('participant role is derived server-side', participant?.role, 'rider');
const chat = await status(
  'passenger joins ride chat',
  200,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/chat`,
);
const conversationId = chat?.conversationId;
await status(
  'stranger cannot read the chat',
  403,
  'C',
  'GET',
  `/api/v1/chat/conversations/${conversationId}/messages`,
);
await status(
  'users cannot send SYSTEM messages',
  400,
  'B',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/messages`,
  { body: 'x', messageType: 'SYSTEM' },
);
await status(
  'passenger sends a message',
  201,
  'B',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/messages`,
  { body: 'hi', messageType: 'TEXT' },
);
const unreadFor = async (who) =>
  (await call(who, 'GET', '/api/v1/chat/conversations')).body?.find?.(
    (c) => c.id === conversationId,
  )?.unreadCount;
expect("the driver sees the passenger's message as unread", await unreadFor('A'), 1);
// B sees only the driver-attributed SYSTEM notice from chat creation; B's own "hi" is not unread.
expect('own messages are never unread', await unreadFor('B'), 1);
await status(
  'anonymous cannot mark a chat read',
  401,
  null,
  'POST',
  `/api/v1/chat/conversations/${conversationId}/read`,
);
await status(
  'stranger cannot mark a chat read',
  403,
  'C',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/read`,
);
await status(
  'an admin outside the chat has no read state to mark',
  403,
  'D',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/read`,
);
expect('failed mark-read calls leave the unread count', await unreadFor('A'), 1);
await status(
  'mark-read rejects a message from another conversation',
  404,
  'A',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/read`,
  { messageId: '00000000-0000-0000-0000-000000000001' },
);
const readState = await status(
  'driver marks the chat read',
  200,
  'A',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/read`,
);
expect('mark-read returns zero unread', readState?.unreadCount, 0);
expect('the unread count drops to 0 after mark-read', await unreadFor('A'), 0);
expect(
  'conversation detail carries the same count',
  (await call('A', 'GET', `/api/v1/chat/conversations/${conversationId}`)).body?.unreadCount,
  0,
);
await status(
  'non-owner cannot invite to chat',
  403,
  'B',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/participants`,
  { userId: C },
);
await status(
  'ratings wait until the ride is completed',
  409,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/ratings`,
  { rating: 5 },
);
await status('driver starts the trip', 200, 'A', 'PATCH', `/api/v1/rides/offers/${rideId}/status`, {
  status: 'IN_PROGRESS',
});
await status(
  'driver completes the trip',
  200,
  'A',
  'PATCH',
  `/api/v1/rides/offers/${rideId}/status`,
  {
    status: 'completed',
  },
);
await status(
  'a completed ride cannot be reopened',
  409,
  'A',
  'PATCH',
  `/api/v1/rides/offers/${rideId}/status`,
  {
    status: 'active',
  },
);
await status('stranger cannot rate', 403, 'C', 'POST', `/api/v1/rides/offers/${rideId}/ratings`, {
  rateeId: A,
  rating: 1,
  comment: 'x',
});
await status('passenger rates driver', 201, 'B', 'POST', `/api/v1/rides/offers/${rideId}/ratings`, {
  rateeId: A,
  rating: 5,
  comment: 'great',
});
await status(
  'duplicate rating rejected',
  409,
  'B',
  'POST',
  `/api/v1/rides/offers/${rideId}/ratings`,
  { rateeId: A, rating: 5, comment: 'again' },
);
await status('bookmark a ride', 200, 'C', 'POST', `/api/v1/rides/${rideId}/favorite`);
await status('remove bookmark', 204, 'C', 'DELETE', `/api/v1/rides/${rideId}/favorite`);

console.log('== rides production rules');
{
  const soon = new Date(Date.now() + 3 * 86400000).toISOString();
  const ride = await call('A', 'POST', '/api/v1/rides/offers', {
    originArea: 'Irving',
    destinationArea: 'Austin',
    departureAt: soon,
    seatsTotal: 3,
    contribution: '$20',
    originLat: 32.8123456,
    originLng: -96.9554321,
  });
  expect('driver offers a ride', ride.status, 201);
  const rid = ride.body?.id;
  const pub = await call('C', 'GET', `/api/v1/rides/offers/${rid}`);
  expect('public ride hides the driver id', pub.body?.driverId, null);
  expect('public ride hides the chat id', pub.body?.conversationId, null);
  expect('public ride coordinates are rounded', pub.body?.originLat, 32.81);
  expect(
    'driver sees their own id',
    (await call('A', 'GET', `/api/v1/rides/offers/${rid}`)).body?.driverId,
    A,
  );
  await status(
    'the short ride path is public for real ids',
    200,
    null,
    'GET',
    `/api/v1/rides/${rid}`,
  );
  await status(
    'anonymous callers cannot read ride history',
    401,
    null,
    'GET',
    '/api/v1/rides/history',
  );
  await status(
    'anonymous callers cannot read saved rooms',
    401,
    null,
    'GET',
    '/api/v1/rooms/favorites',
  );
  await status('strangers cannot edit a ride', 403, 'C', 'PATCH', `/api/v1/rides/offers/${rid}`, {
    contribution: '$1',
  });
  await status('strangers cannot delete a ride', 403, 'C', 'DELETE', `/api/v1/rides/offers/${rid}`);
  await status(
    'strangers cannot change seats',
    403,
    'C',
    'PATCH',
    `/api/v1/rides/offers/${rid}/seats?seats=2`,
  );
  const tamper = await call('A', 'PATCH', `/api/v1/rides/offers/${rid}`, {
    conversationId: '00000000-0000-0000-0000-000000000001',
    status: 'cancelled',
  });
  expect(
    'the edit endpoint ignores chat and status fields',
    [tamper.body?.conversationId, tamper.body?.status],
    [null, 'active'],
  );
  await status('more than 8 seats is a 400', 400, 'A', 'PATCH', `/api/v1/rides/offers/${rid}`, {
    seatsTotal: 20,
  });
  await status('unknown luggage size is a 400', 400, 'A', 'PATCH', `/api/v1/rides/offers/${rid}`, {
    luggageCapacity: 'PIANO',
  });
  await status(
    're-activate needs a future time',
    400,
    'A',
    'POST',
    `/api/v1/rides/offers/${rid}/re-activate`,
    {
      newDepartureAt: '2000-01-01T00:00:00Z',
    },
  );
  const booked = await call('B', 'POST', `/api/v1/rides/offers/${rid}/bookings`, {
    seatsBooked: 2,
  });
  expect('rider books two seats', booked.status, 201);
  await status(
    'seats cannot drop below what riders hold',
    409,
    'A',
    'PATCH',
    `/api/v1/rides/offers/${rid}`,
    {
      seatsTotal: 1,
    },
  );
  const seats = await call('A', 'PATCH', `/api/v1/rides/offers/${rid}/seats?seats=5`);
  expect('opening seats never oversells', seats.body?.seatsAvailable, 1);
  const members = await call('B', 'GET', `/api/v1/rides/offers/${rid}/participants`);
  expect(
    'a booking makes the rider a participant',
    (members.body ?? []).map((p) => p.userId).includes(B),
    true,
  );
  await status('driver cancels the ride', 200, 'A', 'PATCH', `/api/v1/rides/offers/${rid}/status`, {
    status: 'cancelled',
  });
  const after = await call('B', 'GET', `/api/v1/rides/bookings/${booked.body?.id}`);
  expect("cancelling the ride cancels the rider's booking", after.body?.status, 'cancelled');
  const inbox = await call('B', 'GET', '/api/v1/notifications/inbox?size=20');
  expect(
    'riders are notified when the driver cancels',
    (inbox.body?.items ?? []).some((n) => n.title === 'Ride cancelled'),
    true,
  );
  await status(
    'a cancelled ride cannot be edited',
    409,
    'A',
    'PATCH',
    `/api/v1/rides/offers/${rid}`,
    {
      contribution: '$5',
    },
  );
}

console.log('== expenses');
const group = await status('owner creates a group', 201, 'A', 'POST', '/api/v1/expenses/groups', {
  name: 'Smoke test flat',
  groupType: 'APARTMENT',
});
await status(
  'stranger cannot read the group',
  403,
  'C',
  'GET',
  `/api/v1/expenses/groups/${group?.id}`,
);
await status(
  'stranger cannot add an expense',
  403,
  'C',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/expenses`,
  { amount: 10 },
);
await status(
  'owner adds a member',
  200,
  'A',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/members`,
  { userId: B },
);
await status(
  'owner records 100.01',
  201,
  'A',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/expenses`,
  { amount: 100.01, title: 'Groceries' },
);
const owed = (await call('B', 'GET', `/api/v1/expenses/groups/${group?.id}/balances`)).body;
expect('member owes their equal share', owed?.[0]?.amount, 50);
const settlement = await status(
  'member records paying 50',
  201,
  'B',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/settlements`,
  { toUserId: A, amount: 50, status: 'completed', settledAt: '2000-01-01T00:00:00Z' },
);
expect("a payer's record waits for confirmation", settlement?.status, 'pending');
expect('settledAt is never taken from the client', settlement?.settledAt, null);
expect(
  'pending payment does not clear the balance',
  (await call('A', 'GET', `/api/v1/expenses/groups/${group?.id}/balances`)).body?.length,
  1,
);
await status(
  'second pending record for the same pair is rejected',
  409,
  'B',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/settlements`,
  { toUserId: A, amount: 50 },
);
await status(
  'payer cannot confirm their own payment',
  403,
  'B',
  'PATCH',
  `/api/v1/expenses/settlements/${settlement?.id}`,
  { status: 'completed' },
);
await status(
  'recipient confirms the payment',
  200,
  'A',
  'PATCH',
  `/api/v1/expenses/settlements/${settlement?.id}`,
  {
    status: 'completed',
  },
);
await status(
  'completed settlement cannot be reopened',
  409,
  'A',
  'PATCH',
  `/api/v1/expenses/settlements/${settlement?.id}`,
  { status: 'pending' },
);
expect(
  'group balance is cleared',
  (await call('A', 'GET', `/api/v1/expenses/groups/${group?.id}/balances`)).body?.length,
  0,
);
await status(
  'settlement with a non-member rejected',
  400,
  'B',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/settlements`,
  { toUserId: C, amount: 5 },
);

console.log('== community, referrals, notifications, assistant, events');
const communities = (await call('B', 'GET', '/api/v1/posts/communities')).body ?? [];
if (communities.length > 0) {
  const community = communities[0];
  await call('B', 'POST', `/api/v1/posts/communities/${community.id}/leave`);
  const before = (await call('B', 'GET', `/api/v1/posts/communities/${community.id}`)).body
    ?.memberCount;
  await status(
    'join community',
    204,
    'B',
    'POST',
    `/api/v1/posts/communities/${community.id}/join`,
  );
  await status(
    'joining twice is idempotent',
    204,
    'B',
    'POST',
    `/api/v1/posts/communities/${community.id}/join`,
  );
  const after = (await call('B', 'GET', `/api/v1/posts/communities/${community.id}`)).body;
  expect('isJoined reflects membership', after?.isJoined, true);
  expect('member count moves by one', after?.memberCount, before + 1);
  await status(
    'leave community',
    204,
    'B',
    'POST',
    `/api/v1/posts/communities/${community.id}/leave`,
  );
} else {
  skip += 1;
  console.log('  skip community checks (no communities seeded)');
}
const referral = await status('owner creates a referral', 201, 'A', 'POST', '/api/v1/referrals', {
  title: 'Need a referral',
  description: 'SWE',
  category: 'tech',
  details: 'x',
  urgency: 'high',
  desiredOutcome: 'interview',
});
const publicList = (await call(null, 'GET', '/api/v1/referrals/public')).body ?? [];
expect(
  'public referrals never include contact info',
  publicList.every((r) => r.contactInfo === null),
  true,
);
await status(
  'stranger cannot change referral status',
  403,
  'C',
  'PATCH',
  `/api/v1/referrals/${referral?.id}/status`,
  { status: 'closed' },
);
await status(
  'member reads open referral request details',
  200,
  'C',
  'GET',
  `/api/v1/referrals/${referral?.id}/request`,
);
await status(
  'anonymous cannot read referral request details',
  401,
  null,
  'GET',
  `/api/v1/referrals/${referral?.id}/request`,
);
await status(
  'owner closes the referral',
  200,
  'A',
  'PATCH',
  `/api/v1/referrals/${referral?.id}/status`,
  {
    status: 'Closed',
  },
);
await status(
  'stranger cannot read closed referral details',
  404,
  'C',
  'GET',
  `/api/v1/referrals/${referral?.id}/request`,
);
await status(
  'owner still reads closed referral details',
  200,
  'A',
  'GET',
  `/api/v1/referrals/${referral?.id}/request`,
);
await status('offer-referral endpoint works', 201, 'B', 'POST', '/api/v1/referrals/offer', {
  title: 'I can refer',
  serviceType: 'referral',
});
await status(
  'user updates own notification settings',
  200,
  'A',
  'PATCH',
  '/api/v1/notifications/settings',
  { preferences: { push: false, hacker: true } },
);
expect(
  'other users are unaffected',
  (await call('B', 'GET', '/api/v1/notifications/settings')).body?.preferences?.push,
  true,
);
expect(
  'unknown setting keys are ignored',
  'hacker' in ((await call('A', 'GET', '/api/v1/notifications/settings')).body?.preferences ?? {}),
  false,
);
await status('users cannot create notifications', 403, 'B', 'POST', '/api/v1/notifications', {
  title: 't',
  body: 'b',
  type: 'SYSTEM',
});
const notification = await status(
  'admin creates a notification',
  201,
  'D',
  'POST',
  '/api/v1/notifications',
  { title: 't', body: 'b', type: 'SYSTEM' },
);
await status(
  "cannot open someone else's notification",
  403,
  'B',
  'GET',
  `/api/v1/notifications/${notification?.id}`,
);
expect(
  'inbox shows only real notifications',
  (await call('D', 'GET', '/api/v1/notifications/inbox')).body?.items?.some(
    (n) => n.id === notification?.id,
  ),
  true,
);
await status('assistant message', 201, 'A', 'POST', '/api/v1/assistant/messages', {
  content: 'hello',
});
const aConversation = (await call('A', 'GET', '/api/v1/assistant/history')).body?.[0]?.id;
await status(
  "cannot read another user's assistant chat",
  403,
  'B',
  'GET',
  `/api/v1/assistant/conversations/${aConversation}/messages`,
);
const categories = (await call(null, 'GET', '/api/v1/events/categories')).body ?? [];
if (categories.length > 0) {
  const event = await status('create event', 201, 'A', 'POST', '/api/v1/events', {
    categoryId: categories[0].id,
    title: 'Diwali',
    description: 'fun',
    location: 'Irving',
    latitude: 32.8,
    longitude: -96.9,
    startAt: departureAt,
    endAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  });
  await status('RSVP', 201, 'B', 'POST', `/api/v1/events/${event?.id}/attendance`, {
    status: 'GOING',
  });
  await status(
    're-RSVP updates in place',
    201,
    'B',
    'POST',
    `/api/v1/events/${event?.id}/attendance`,
    { status: 'MAYBE' },
  );
  expect(
    'organizer sees one guest row',
    (await call('A', 'GET', `/api/v1/events/${event?.id}/attendance`)).body?.length,
    1,
  );
  expect(
    'stranger sees no guests',
    (await call('C', 'GET', `/api/v1/events/${event?.id}/attendance`)).body?.length,
    0,
  );
} else {
  skip += 1;
  console.log('  skip event checks (no event categories seeded)');
}
await status('uploads reject non-image types', 400, 'A', 'POST', '/api/v1/media/upload-url', {
  bucket: 'avatars',
  contentType: 'text/html',
  size: 100,
});
await status('uploads reject files over 5 MB', 400, 'A', 'POST', '/api/v1/media/upload-url', {
  bucket: 'avatars',
  contentType: 'image/jpeg',
  size: 6 * 1024 * 1024,
});
await status('uploads reject unknown buckets', 400, 'A', 'POST', '/api/v1/media/upload-url', {
  bucket: 'secrets',
  contentType: 'image/png',
  size: 100,
});
await status("cannot delete someone else's file", 404, 'C', 'POST', '/api/v1/media/delete', {
  bucket: 'avatars',
  path: `${A}/00000000-0000-0000-0000-000000000000.png`,
});
{
  const room = await call('A', 'POST', '/api/v1/rooms/listings', {
    title: 'Image check',
    price: 700,
    roomType: 'private',
    broadLocation: 'Irving',
  });
  await status(
    'listing images must be uploads, not arbitrary URLs',
    400,
    'A',
    'POST',
    `/api/v1/rooms/listings/${room.body?.id}/images`,
    { url: 'https://images.unsplash.com/photo.jpg', sortOrder: 0 },
  );
  await status(
    "listing images cannot point into someone else's folder",
    400,
    'A',
    'POST',
    `/api/v1/rooms/listings/${room.body?.id}/images`,
    {
      url: `http://localhost:9999/storage/v1/object/public/rooms/${C}/00000000-0000-0000-0000-000000000000.jpg`,
      sortOrder: 0,
    },
  );
  await status(
    'owner adds an image from their own upload folder',
    201,
    'A',
    'POST',
    `/api/v1/rooms/listings/${room.body?.id}/images`,
    {
      url: `http://localhost:9999/storage/v1/object/public/rooms/${A}/00000000-0000-0000-0000-000000000000.jpg`,
      sortOrder: 0,
    },
  );
}

console.log('== token validation');
{
  // Signature, expiry, issuer, and audience are all enforced by the backend's JWT decoder.
  const now = Math.floor(Date.now() / 1000);
  const bearer = async (label, jwt) => {
    const res = await fetch(`${base}/api/v1/me`, { headers: { Authorization: `Bearer ${jwt}` } });
    expect(label, res.status, 401);
  };
  const valid = mint(A);
  const [head, body, sig] = valid.split('.');
  const flipped = `${sig.slice(0, -2)}${sig.endsWith('AA') ? 'BB' : 'AA'}`;
  await status('valid token reads /me', 200, 'A', 'GET', '/api/v1/me');
  await status('missing token is rejected', 401, null, 'GET', '/api/v1/me');
  await bearer('expired token is rejected', mint(A, [], {}, { iat: now - 7200, exp: now - 60 }));
  await bearer('wrong issuer is rejected', mint(A, [], {}, { iss: 'https://attacker.example' }));
  await bearer('wrong audience is rejected', mint(A, [], {}, { aud: 'service_role' }));
  await bearer('tampered signature is rejected', `${head}.${body}.${flipped}`);
}

console.log('== notifications');
{
  const inbox = (await call('A', 'GET', '/api/v1/notifications/inbox?size=50')).body ?? {
    items: [],
  };
  const rideNote = inbox.items.find((n) => n.meta === 'RIDE');
  expect('a seat request notifies the driver', Boolean(rideNote), true);
  expect('inbox reports an unread count', typeof inbox.unreadCount, 'number');
  const big = await call('A', 'GET', '/api/v1/notifications/inbox?size=5000');
  expect('inbox page size is capped at 50', (big.body?.items ?? []).length <= 50, true);
  if (rideNote) {
    await status(
      "member cannot read another's notification",
      403,
      'B',
      'GET',
      `/api/v1/notifications/${rideNote.id}`,
    );
    await status(
      "member cannot mark another's notification read",
      403,
      'B',
      'POST',
      `/api/v1/notifications/${rideNote.id}/read`,
    );
    const opened = (await call('A', 'GET', `/api/v1/notifications/${rideNote.id}`)).body;
    expect('opening a notification does not mark it read', opened?.read, rideNote.read);
    const marked = (await call('A', 'POST', `/api/v1/notifications/${rideNote.id}/read`)).body;
    expect('recipient marks it read', marked?.read, true);
  } else {
    skip += 1;
  }
  await status('mark all read', 200, 'A', 'POST', '/api/v1/notifications/read-all');
  expect(
    'unread count is zero after mark all read',
    (await call('A', 'GET', '/api/v1/notifications/unread-count')).body,
    0,
  );
  await status(
    'invalid quiet hours are a 400',
    400,
    'A',
    'PATCH',
    '/api/v1/notifications/settings',
    {
      preferences: { quietStart: '25:00' },
    },
  );
  const quiet = await call('A', 'PATCH', '/api/v1/notifications/settings', {
    preferences: { quietHours: true, quietStart: '22:30', timeZone: 'America/Chicago' },
  });
  expect('quiet hours persist', quiet.body?.preferences?.quietStart, '22:30');
  const channels = (await call('A', 'GET', '/api/v1/notifications/preferences')).body ?? [];
  await call('A', 'POST', '/api/v1/notifications/preferences', { channel: 'PUSH', enabled: false });
  expect(
    'channel switches and settings are one store',
    (await call('A', 'GET', '/api/v1/notifications/settings')).body?.preferences?.push,
    false,
  );
  expect('channel list derives from settings', channels.length, 4);
  await call('A', 'POST', '/api/v1/notifications/preferences', { channel: 'PUSH', enabled: true });
  await status('non-Expo push token rejected', 400, 'A', 'POST', '/api/v1/notifications/devices', {
    token: 'https://evil.example/hook',
    platform: 'ios',
  });
  const token = `ExponentPushToken[smoke${Date.now()}]`;
  await status('member registers a push token', 200, 'A', 'POST', '/api/v1/notifications/devices', {
    token,
    platform: 'ios',
  });
  await status(
    "stranger cannot remove someone else's token",
    404,
    'C',
    'POST',
    '/api/v1/notifications/devices/remove',
    {
      token,
    },
  );
  await status(
    'owner removes their token',
    204,
    'A',
    'POST',
    '/api/v1/notifications/devices/remove',
    { token },
  );
  await status(
    'users cannot create notifications by hand',
    403,
    'B',
    'POST',
    '/api/v1/notifications',
    {
      title: 'x',
      body: 'y',
      type: 'SYSTEM',
    },
  );
}

console.log('== jobs, utilities');
{
  let categories = (await call(null, 'GET', '/api/v1/jobs/categories')).body ?? [];
  if (categories.length === 0) {
    await call('D', 'POST', '/api/v1/jobs/categories', {
      name: 'Software',
      slug: `software-${Date.now()}`,
    });
    categories = (await call(null, 'GET', '/api/v1/jobs/categories')).body ?? [];
  }
  const job = await call('A', 'POST', '/api/v1/jobs', {
    categoryId: categories[0]?.id,
    title: 'Smoke engineer',
    company: 'Acme',
    location: 'Irving',
    description: 'Build things',
    employmentType: 'FULL_TIME',
  });
  if (job.status === 201) {
    const application = await status(
      'member applies',
      201,
      'B',
      'POST',
      `/api/v1/jobs/${job.body.id}/applications`,
      {
        coverLetter: 'hi',
      },
    );
    await status(
      'duplicate application rejected',
      409,
      'B',
      'POST',
      `/api/v1/jobs/${job.body.id}/applications`,
      {
        coverLetter: 'again',
      },
    );
    await status(
      'employer cannot apply to own job',
      409,
      'A',
      'POST',
      `/api/v1/jobs/${job.body.id}/applications`,
      {
        coverLetter: 'me',
      },
    );
    await status(
      'applicant cannot accept own application',
      403,
      'B',
      'PATCH',
      `/api/v1/jobs/applications/${application?.id}`,
      { status: 'accepted' },
    );
    await status(
      'stranger cannot list applicants',
      403,
      'C',
      'GET',
      `/api/v1/jobs/${job.body.id}/applications`,
    );
    await status(
      'employer accepts',
      200,
      'A',
      'PATCH',
      `/api/v1/jobs/applications/${application?.id}`,
      {
        status: 'accepted',
      },
    );
  } else {
    console.log(`  skip jobs checks (create returned ${job.status})`);
    skip += 1;
  }
}
await status('unknown package status is a 400', 400, 'A', 'POST', '/api/v1/utilities/packages', {
  trackingNumber: '1Z999',
  carrier: 'UPS',
  status: 'teleported',
});

console.log('== account data');
{
  await status('anonymous cannot export data', 401, null, 'GET', '/api/v1/me/export');
  const exported = await call('A', 'GET', '/api/v1/me/export');
  expect('member exports their data', exported.status, 200);
  const rows = Object.values(exported.body?.data ?? {}).flat();
  expect(
    'export holds only rows that belong to the caller',
    exported.body?.userId === A && rows.length > 0,
    true,
  );
  // A throwaway account: signs up through the local auth stub, creates data, then deletes itself.
  const signup = await fetch('http://localhost:9999/auth/v1/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `delete-${Date.now()}@example.test`, password: 'Delete-me-123' }),
  }).then((r) => r.json());
  const F = signup.user?.id;
  if (F) {
    const now = Math.floor(Date.now() / 1000);
    token.F = mint(F, [], {}, { amr: [{ method: 'password', timestamp: now }] });
    token.Fstale = mint(F, [], {}, { amr: [{ method: 'password', timestamp: now - 3600 }] });
    const doomed = await status(
      'throwaway account creates a referral',
      201,
      'F',
      'POST',
      '/api/v1/referrals',
      {
        title: 'Delete me',
        description: 'x',
        category: 'tech',
        details: 'x',
        urgency: 'low',
        desiredOutcome: 'x',
      },
    );
    await status('deleting needs a recent sign-in', 401, 'Fstale', 'DELETE', '/api/v1/me');
    await status('member deletes their account', 204, 'F', 'DELETE', '/api/v1/me');
    await status('deleted data is gone', 404, 'A', 'GET', `/api/v1/referrals/${doomed?.id}`);
  } else {
    console.log('  skip deletion checks (local auth signup unavailable)');
    skip += 1;
  }
}

console.log('== admin');
await status('non-admin blocked from admin API', 403, 'B', 'GET', '/api/v1/admin/rooms');
await status('admin lists users', 200, 'D', 'GET', '/api/v1/admin/users');
await status('admin reads the audit log', 200, 'D', 'GET', '/api/v1/admin/audit-log');
await status(
  'ADMIN cannot run production automations',
  403,
  'D',
  'POST',
  '/api/v1/admin/automations/deploy-backend/executions',
  {
    environment: 'production',
    ref: 'main',
    reason: 'smoke test of the production gate',
    confirmed: true,
  },
);

await status(
  'admin cannot suspend themselves',
  403,
  'D',
  'PATCH',
  `/api/v1/admin/users/${D}/status`,
  {
    status: 'Suspended',
  },
);
{
  const report = await status(
    'member files a safety report',
    201,
    'B',
    'POST',
    '/api/v1/safety/reports',
    {
      targetId: C,
      category: 'harassment',
      description: 'smoke test report',
      severity: 'LOW',
    },
  );
  await status(
    'reporter cannot resolve their own report',
    403,
    'B',
    'POST',
    `/api/v1/safety/reports/${report?.id}/resolve`,
  );
  await status(
    'admin resolves the report',
    200,
    'D',
    'POST',
    `/api/v1/admin/reports/${report?.id}/resolve`,
  );
}
if (conversationId) {
  await status(
    'admin can open a chat they are not in',
    200,
    'D',
    'GET',
    `/api/v1/chat/conversations/${conversationId}/messages`,
  );
  const log = (await call('D', 'GET', '/api/v1/admin/audit-log')).body ?? [];
  expect(
    'admin chat access is written to the audit log',
    log.some((e) => e.action === 'chat.admin_access' && e.targetId === conversationId),
    true,
  );
} else {
  skip += 1;
}

console.log('== graphql');
const gql = await call('C', 'POST', '/graphql', {
  query: `{ rideParticipants(rideId: "${rideId}") { id } }`,
});
expect(
  'GraphQL enforces ride membership',
  gql.body?.errors?.[0]?.extensions?.classification,
  'FORBIDDEN',
);
{
  const created = await call('C', 'POST', '/graphql', {
    query:
      'mutation { createRoomListing(input: { title: "GQL room", price: "900", roomType: "private", broadLocation: "Irving" }) { id status } }',
  });
  expect(
    'GraphQL createRoomListing starts as a draft',
    created.body?.data?.createRoomListing?.status,
    'draft',
  );
  const invalid = await call('C', 'POST', '/graphql', {
    query:
      'mutation { createRoomListing(input: { title: "", price: "-5", roomType: "private", broadLocation: "Irving" }) { id } }',
  });
  expect('GraphQL createRoomListing validates input', Boolean(invalid.body?.errors?.length), true);
  const saved = await call('B', 'POST', '/graphql', { query: '{ savedRoomListings { id } }' });
  const favorites = (await call('B', 'GET', '/api/v1/rooms/favorites')).body ?? [];
  expect(
    "GraphQL savedRoomListings returns only the caller's favorites",
    (saved.body?.data?.savedRoomListings ?? []).length,
    Array.isArray(favorites) ? favorites.length : -1,
  );
}
{
  const forged = await call('C', 'POST', '/api/v1/rooms/listings', {
    title: 'Forged host',
    price: 800,
    roomType: 'private',
    broadLocation: 'Irving',
    isVerifiedHost: true,
  });
  expect('owners cannot mark themselves verified hosts', forged.body?.isVerifiedHost, false);
}

console.log('== rooms production rules');
{
  const created = await call('A', 'POST', '/api/v1/rooms/listings', {
    title: 'Smoke room',
    price: 950,
    roomType: 'Private Room',
    broadLocation: 'Irving, TX',
    exactAddress: '1 Hidden St',
    latitude: 32.8123456,
    longitude: -96.9554321,
    amenities: ['WiFi', 'Parking', 'WiFi'],
  });
  expect('owner creates a draft listing', created.status, 201);
  expect('amenities are saved without duplicates', created.body?.amenities, ['WiFi', 'Parking']);
  const id = created.body?.id;
  await status('strangers cannot see a draft', 404, 'B', 'GET', `/api/v1/rooms/listings/${id}`);
  await status('owner opens their own draft', 200, 'A', 'GET', `/api/v1/rooms/listings/${id}`);
  await status(
    'strangers cannot see draft photos',
    404,
    'B',
    'GET',
    `/api/v1/rooms/listings/${id}/images`,
  );
  await status(
    'owner sees their own draft photos',
    200,
    'A',
    'GET',
    `/api/v1/rooms/listings/${id}/images`,
  );
  await status(
    'strangers cannot edit a listing',
    403,
    'C',
    'PATCH',
    `/api/v1/rooms/listings/${id}`,
    {
      price: 1,
    },
  );
  await status(
    'strangers cannot delete a listing',
    403,
    'C',
    'DELETE',
    `/api/v1/rooms/listings/${id}`,
  );
  await status(
    'only the owner publishes',
    403,
    'D',
    'PATCH',
    `/api/v1/rooms/listings/${id}/publish`,
  );
  await status('owner publishes', 200, 'A', 'PATCH', `/api/v1/rooms/listings/${id}/publish`);
  const pub = await call('B', 'GET', `/api/v1/rooms/listings/${id}`);
  expect('public listing hides the owner id', pub.body?.ownerId, undefined);
  expect('public listing hides the exact address', pub.body?.exactAddress, undefined);
  expect('public coordinates are rounded', pub.body?.latitude, 32.81);
  expect('public listing tells the viewer they are not the owner', pub.body?.isOwner, false);
  const near = async (lat, lng) =>
    (
      (
        await call(
          null,
          'GET',
          `/api/v1/rooms/listings?lat=${lat}&lng=${lng}&radiusMiles=0.001&size=200`,
        )
      ).body?.content ?? []
    ).some((l) => l.id === id);
  expect(
    'a tiny radius search cannot pinpoint the exact spot',
    await near(32.8123456, -96.9554321),
    await near(32.81, -96.96),
  );
  const own = await call('A', 'GET', `/api/v1/rooms/listings/${id}`);
  expect('owner sees isOwner', own.body?.isOwner, true);
  const gql = await call('B', 'POST', '/graphql', {
    query: `{ roomListing(id: "${id}") { ownerId isOwner latitude exactAddress } }`,
  });
  expect('GraphQL hides the owner id and exact address', gql.body?.data?.roomListing, {
    ownerId: null,
    isOwner: false,
    latitude: '32.81',
    exactAddress: null,
  });
  await status('unknown diet value is a 400', 400, 'A', 'PATCH', `/api/v1/rooms/listings/${id}`, {
    dietaryPreference: 'CARNIVORE',
  });
  await status('negative deposit is a 400', 400, 'A', 'PATCH', `/api/v1/rooms/listings/${id}`, {
    securityDeposit: -5,
  });
  await status('missing price is a 400', 400, 'A', 'POST', '/api/v1/rooms/listings', {
    title: 'No price',
    roomType: 'Private Room',
  });
  const moveIn = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const first = await call('B', 'POST', `/api/v1/rooms/${id}/inquire`, {
    moveInDate: moveIn,
    stayDurationMonths: null,
    introMessage: 'Hello from smoke',
  });
  expect('guest inquires about an active room', first.status, 200);
  const again = await call('B', 'POST', `/api/v1/rooms/${id}/inquire`, {
    moveInDate: moveIn,
    introMessage: 'Following up',
  });
  expect(
    'a repeat inquiry reuses the same chat',
    again.body?.conversationId,
    first.body?.conversationId,
  );
  await status('past move-in date is a 400', 400, 'B', 'POST', `/api/v1/rooms/${id}/inquire`, {
    moveInDate: '2000-01-01',
    introMessage: 'Too late',
  });
  await status(
    'owner cannot report their own listing',
    400,
    'A',
    'POST',
    `/api/v1/rooms/listings/${id}/report`,
    {
      reason: 'spam',
    },
  );
  await status('guest reports a listing', 201, 'B', 'POST', `/api/v1/rooms/listings/${id}/report`, {
    reason: 'spam',
  });
  await status(
    'non-admins cannot read the report queue',
    403,
    'B',
    'GET',
    '/api/v1/rooms/admin/reports',
  );
  await status('admins read the report queue', 200, 'D', 'GET', '/api/v1/rooms/admin/reports');
  await status(
    'unknown report status is a 400',
    400,
    'D',
    'GET',
    '/api/v1/rooms/admin/reports?status=bogus',
  );
  const booking = await call('B', 'POST', `/api/v1/rooms/listings/${id}/bookings`, {
    message: 'Hi',
  });
  expect('guest requests a booking', booking.status, 201);
  await status(
    'missing booking status is a 400',
    400,
    'A',
    'PATCH',
    `/api/v1/rooms/bookings/${booking.body?.id}/status`,
    {},
  );
  await status(
    'guest cancels',
    200,
    'B',
    'PATCH',
    `/api/v1/rooms/bookings/${booking.body?.id}/status`,
    {
      status: 'cancelled',
    },
  );
  await status(
    'a cancelled booking cannot be accepted',
    409,
    'A',
    'PATCH',
    `/api/v1/rooms/bookings/${booking.body?.id}/status`,
    {
      status: 'accepted',
    },
  );
  const gqlSelf = await call('A', 'POST', '/graphql', {
    query: `mutation { bookRoom(roomId: "${id}", input: { message: "self" }) { id } }`,
  });
  expect(
    'GraphQL bookRoom blocks booking your own room',
    Boolean(gqlSelf.body?.errors?.length),
    true,
  );
  const rented = await call('A', 'PATCH', `/api/v1/rooms/listings/${id}`, { status: 'rented' });
  expect('owner marks the room rented', rented.body?.status, 'rented');
  await status(
    'a rented room is hidden from search detail',
    404,
    'B',
    'GET',
    `/api/v1/rooms/listings/${id}`,
  );
  await status('owner relists', 200, 'A', 'PATCH', `/api/v1/rooms/listings/${id}/publish`);
}

console.log('== marketplace production rules');
{
  await status(
    'non-admins cannot create categories',
    403,
    'B',
    'POST',
    '/api/v1/marketplace/categories',
    {
      name: 'Nope',
      slug: `nope-${Date.now()}`,
    },
  );
  const category = await call('D', 'POST', '/api/v1/marketplace/categories', {
    name: 'Smoke furniture',
    slug: `smoke-furniture-${Date.now()}`,
  });
  expect('admins create categories', category.status, 201);
  const created = await call('A', 'POST', '/api/v1/marketplace/listings', {
    categoryId: category.body?.id,
    title: 'Smoke desk',
    price: 40,
    currency: 'USD',
    condition: 'Like New',
    location: 'Irving',
  });
  expect('seller lists an item', created.status, 201);
  const id = created.body?.id;
  const pub = await call('B', 'GET', `/api/v1/marketplace/listings/${id}`);
  expect('public listing hides the seller id', pub.body?.ownerId, undefined);
  expect('public listing says it is not mine', pub.body?.isMine, false);
  expect(
    'seller sees isMine',
    (await call('A', 'GET', `/api/v1/marketplace/listings/${id}`)).body?.isMine,
    true,
  );
  await status(
    'strangers cannot edit a listing',
    403,
    'C',
    'PATCH',
    `/api/v1/marketplace/listings/${id}`,
    {
      price: 1,
    },
  );
  await status(
    'strangers cannot delete a listing',
    403,
    'C',
    'DELETE',
    `/api/v1/marketplace/listings/${id}`,
  );
  await status('unknown status is a 400', 400, 'A', 'PATCH', `/api/v1/marketplace/listings/${id}`, {
    status: 'banana',
  });
  await status(
    'sellers cannot remove listings themselves',
    403,
    'A',
    'PATCH',
    `/api/v1/marketplace/listings/${id}`,
    {
      status: 'removed',
    },
  );
  await status('missing price is a 400', 400, 'A', 'POST', '/api/v1/marketplace/listings', {
    categoryId: category.body?.id,
    title: 'No price',
    currency: 'USD',
  });
  await status(
    'unknown sort is ignored, not a 500',
    200,
    null,
    'GET',
    '/api/v1/marketplace/listings?sort=nope,desc',
  );
  const found = await call(
    null,
    'GET',
    `/api/v1/marketplace/listings?q=smoke%20desk&categoryId=${category.body?.id}`,
  );
  expect(
    'server-side search finds the item',
    (found.body?.content ?? []).some((l) => l.id === id),
    true,
  );
  await status(
    'sellers cannot save their own listing',
    400,
    'A',
    'POST',
    `/api/v1/marketplace/listings/${id}/favorite`,
  );
  await status(
    'buyer saves the listing',
    201,
    'B',
    'POST',
    `/api/v1/marketplace/listings/${id}/favorite`,
  );
  const saved = await call('B', 'GET', '/api/v1/marketplace/favorites/listings');
  expect(
    'saved listings come back as listings',
    (saved.body ?? []).some((l) => l.id === id),
    true,
  );
  const contact = await call('B', 'POST', `/api/v1/marketplace/listings/${id}/contact`);
  expect('buyer opens a chat with the seller', Boolean(contact.body?.conversationId), true);
  const again = await call('B', 'POST', `/api/v1/marketplace/listings/${id}/contact`);
  expect(
    'contacting again reuses the chat',
    again.body?.conversationId,
    contact.body?.conversationId,
  );
  await status(
    'sellers cannot contact themselves',
    400,
    'A',
    'POST',
    `/api/v1/marketplace/listings/${id}/contact`,
  );
  await status(
    'buyer reports the listing',
    201,
    'B',
    'POST',
    `/api/v1/marketplace/listings/${id}/report`,
    {
      reason: 'spam',
    },
  );
  await status(
    'a second open report is a 409',
    409,
    'B',
    'POST',
    `/api/v1/marketplace/listings/${id}/report`,
    {
      reason: 'spam',
    },
  );
  const mine = await call('A', 'GET', '/api/v1/marketplace/listings/mine');
  expect(
    'seller sees their listings',
    (mine.body ?? []).some((l) => l.id === id),
    true,
  );
  await status(
    'seller marks the item sold',
    200,
    'A',
    'PATCH',
    `/api/v1/marketplace/listings/${id}`,
    {
      status: 'sold',
    },
  );
  await status(
    'moderator removes the listing',
    200,
    'D',
    'PATCH',
    `/api/v1/marketplace/listings/${id}`,
    {
      status: 'removed',
    },
  );
  await status(
    'removed listings are hidden from buyers',
    404,
    'B',
    'GET',
    `/api/v1/marketplace/listings/${id}`,
  );
  await status(
    'seller deletes the listing',
    204,
    'A',
    'DELETE',
    `/api/v1/marketplace/listings/${id}`,
  );
}

console.log('== paged responses use the PagedModel shape');
for (const path of [
  '/api/v1/rooms/listings?size=2',
  '/api/v1/rides/offers?size=2',
  '/api/v1/marketplace/listings?size=2',
  '/api/v1/events?size=2',
  '/api/v1/events/search?size=2',
  '/api/v1/jobs?size=2',
]) {
  const res = await call('A', 'GET', path);
  const body = res.body ?? {};
  expect(
    `${path} returns content plus page metadata`,
    [
      res.status,
      Array.isArray(body.content),
      Object.keys(body.page ?? {}).sort(),
      'totalElements' in body || 'last' in body || 'pageable' in body,
    ],
    [200, true, ['number', 'size', 'totalElements', 'totalPages'], false],
  );
}

console.log(`\nPASS=${pass} FAIL=${fail}${skip ? ` SKIPPED_GROUPS=${skip}` : ''}`);
process.exit(fail > 0 ? 1 : 0);
