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
const token = { A: mint(A), B: mint(B), C: mint(C), D: mint(D, ['ADMIN']) };

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
  'rider requests a seat with a note',
  201,
  'B',
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
  'B',
  'PATCH',
  `/api/v1/rides/requests/${request?.id}/status`,
  { status: 'accepted' },
);
await status('driver accepts', 200, 'A', 'PATCH', `/api/v1/rides/requests/${request?.id}/status`, {
  status: 'ACCEPTED',
});
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
await status(
  'non-owner cannot invite to chat',
  403,
  'B',
  'POST',
  `/api/v1/chat/conversations/${conversationId}/participants`,
  { userId: C },
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
await status('driver starts the trip', 200, 'A', 'PATCH', `/api/v1/rides/offers/${rideId}/status`, {
  status: 'IN_PROGRESS',
});

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
await status(
  'member settles 50',
  201,
  'B',
  'POST',
  `/api/v1/expenses/groups/${group?.id}/settlements`,
  { toUserId: A, amount: 50 },
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
await status('upload path traversal rejected', 400, 'A', 'POST', '/api/v1/media/upload-url', {
  bucket: 'avatars',
  path: '../x.png',
});

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

console.log('== graphql');
const gql = await call('C', 'POST', '/graphql', {
  query: `{ rideParticipants(rideId: "${rideId}") { id } }`,
});
expect(
  'GraphQL enforces ride membership',
  gql.body?.errors?.[0]?.extensions?.classification,
  'FORBIDDEN',
);

console.log(`\nPASS=${pass} FAIL=${fail}${skip ? ` SKIPPED_GROUPS=${skip}` : ''}`);
process.exit(fail > 0 ? 1 : 0);
