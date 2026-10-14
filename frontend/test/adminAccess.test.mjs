import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adminRoleOf,
  hasAdminAccess,
  isOpenReport,
  isSuspended,
  statusLabel,
} from '../src/modules/admin/adminAccess.ts';

test('admin role comes from the identity or signed app_metadata roles', () => {
  assert.equal(adminRoleOf('SUPER_ADMIN', null), 'SUPER_ADMIN');
  assert.equal(adminRoleOf('user', { roles: ['admin'] }), 'ADMIN');
  assert.equal(adminRoleOf(null, { roles: 'super_admin' }), 'SUPER_ADMIN');
  assert.equal(adminRoleOf('ROLE_ADMIN', { roles: ['super_admin'] }), 'SUPER_ADMIN');
  assert.equal(adminRoleOf('user', { roles: [] }), null);
  assert.equal(adminRoleOf(undefined, undefined), null);
});

test('super admin screens need the super admin role', () => {
  assert.equal(hasAdminAccess('ADMIN'), true);
  assert.equal(hasAdminAccess('ADMIN', 'SUPER_ADMIN'), false);
  assert.equal(hasAdminAccess('SUPER_ADMIN', 'SUPER_ADMIN'), true);
  assert.equal(hasAdminAccess(null), false);
});

test('open reports match the dashboard rule, case-insensitively', () => {
  for (const s of ['OPEN', 'open', 'IN_REVIEW', 'pending']) assert.equal(isOpenReport(s), true);
  for (const s of ['RESOLVED', 'DISMISSED', '', null]) assert.equal(isOpenReport(s), false);
  assert.equal(statusLabel('IN_REVIEW'), 'In review');
  assert.equal(isSuspended('Suspended'), true);
  assert.equal(isSuspended('Active'), false);
});
