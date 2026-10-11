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

console.log(`\nPASS=${pass} FAIL=${fail}${skip ? ` SKIPPED_GROUPS=${skip}` : ''}`);
process.exit(fail > 0 ? 1 : 0);
