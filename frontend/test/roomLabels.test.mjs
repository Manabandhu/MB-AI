import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dietaryLabel,
  isNotFound,
  moveInDateError,
} from '../src/modules/rooms/utils/roomLabels.ts';

test('move-in date must be a real YYYY-MM-DD date', () => {
  assert.equal(moveInDateError('2026-13-01', '2026-01-01'), 'That date does not exist.');
  assert.equal(moveInDateError('2026-02-30', '2026-01-01'), 'That date does not exist.');
  assert.equal(moveInDateError('12/01/2026', '2026-01-01'), 'Use the format YYYY-MM-DD.');
});

test('move-in date cannot be in the past', () => {
  assert.equal(moveInDateError('2025-12-31', '2026-01-01'), 'Move-in date cannot be in the past.');
  assert.equal(moveInDateError('2026-01-01', '2026-01-01'), null);
  assert.equal(moveInDateError('2026-06-15', '2026-01-01'), null);
});

test('labels fall back to the raw value and ignore case', () => {
  assert.equal(dietaryLabel('pure_veg'), 'Pure veg only');
  assert.equal(dietaryLabel('SOMETHING_NEW'), 'SOMETHING_NEW');
  assert.equal(dietaryLabel(null), null);
});

test('only a 404 counts as not found', () => {
  assert.equal(isNotFound({ status: 404 }), true);
  assert.equal(isNotFound({ status: 500 }), false);
  assert.equal(isNotFound(null), false);
});
