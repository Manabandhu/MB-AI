import assert from 'node:assert/strict';
import test from 'node:test';
import { navigableDestinations, searchDestinations } from '../src/modules/foundation/launcher/commandSearch.ts';

const items = [
  { id: 'rooms.saved', title: 'Saved Rooms', module: 'rooms', route: '/rooms/saved' },
  { id: 'jobs.post', title: 'Post a Job', module: 'jobs', route: '/jobs/post' },
  { id: 'rooms.detail', title: 'Room Details', module: 'rooms', route: '/rooms/[roomId]' },
  { id: 'admin.home', title: 'Admin', module: 'admin', route: '/admin' },
  { id: 'admin.automations', title: 'Automations', module: 'admin', route: '/admin/automations' },
  { id: 'auth.signin', title: 'Sign In', module: 'foundation', route: '/sign-in' },
  { id: 'foundation.onboard', title: 'Complete', module: 'foundation', route: '/onboarding/complete' },
];
test('launcher excludes item-dependent, auth, onboarding and unauthorized admin destinations', () => {
  assert.deepEqual(navigableDestinations(items).map((item) => item.id), ['rooms.saved', 'jobs.post']);
  assert.equal(navigableDestinations(items, true).some((item) => item.id === 'admin.home'), true);
  assert.equal(navigableDestinations(items, true, false).some((item) => item.route === '/admin/automations'), false);
});
test('every search term matches regardless of case, accents or extra whitespace', () => {
  assert.deepEqual(searchDestinations(items, '  SAVÉD  rooms ').map((item) => item.id), ['rooms.saved']);
  assert.deepEqual(searchDestinations(items, 'jobs post').map((item) => item.id), ['jobs.post']);
  assert.deepEqual(searchDestinations(items, 'rooms job'), []);
  assert.equal(searchDestinations(items, '   ').length, items.length);
});
