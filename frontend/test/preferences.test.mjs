import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveColorScheme, resolveMotion } from '../src/theme/preferences.ts';

test('explicit theme choices win over the system scheme', () => {
  assert.equal(resolveColorScheme('dark', 'light'), 'dark');
  assert.equal(resolveColorScheme('light', 'dark'), 'light');
});

test('system theme follows the OS and defaults to light when unknown', () => {
  assert.equal(resolveColorScheme('system', 'dark'), 'dark');
  assert.equal(resolveColorScheme('system', 'light'), 'light');
  assert.equal(resolveColorScheme('system', null), 'light');
  assert.equal(resolveColorScheme('system', 'unspecified'), 'light');
});

test('OS reduced motion always limits animations', () => {
  assert.equal(resolveMotion('full', true), 'reduced');
  assert.equal(resolveMotion('full', false), 'full');
  assert.equal(resolveMotion('off', false), 'off');
  assert.equal(resolveMotion('off', true), 'off');
  assert.equal(resolveMotion('reduced', false), 'reduced');
});
