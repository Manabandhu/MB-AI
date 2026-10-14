import assert from 'node:assert/strict';
import { test } from 'node:test';
import { routeForPushData } from '../src/modules/notifications/pushRoutes.ts';

test('a push opens its in-app route', () => {
  assert.equal(routeForPushData({ route: '/rides/1', notificationId: 'n1' }), '/rides/1');
});

test('without a route a push opens the notification', () => {
  assert.equal(routeForPushData({ notificationId: 'n1' }), '/notifications/n1');
});

test('external or malformed routes are ignored', () => {
  assert.equal(routeForPushData({ route: 'https://evil.example' }), null);
  assert.equal(routeForPushData({ route: '//evil.example/x' }), null);
  assert.equal(routeForPushData(undefined), null);
});
