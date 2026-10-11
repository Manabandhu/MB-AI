import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canStep,
  clampNumber,
  dayDifference,
  fromInputValue,
  monthGrid,
  shiftTimeOfDay,
  stepValue,
  toInputValue,
} from '../src/modules/shared/ui/fieldMath.ts';

test('clampNumber keeps values within bounds', () => {
  assert.equal(clampNumber(5, 1, 8), 5);
  assert.equal(clampNumber(0, 1, 8), 1);
  assert.equal(clampNumber(12, 1, 8), 8);
  assert.equal(clampNumber(Number.NaN, 1, 8), 1);
});

test('stepValue moves by step and stops at the bounds', () => {
  assert.equal(stepValue(3, 1, 1, 8), 4);
  assert.equal(stepValue(8, 1, 1, 8), 8);
  assert.equal(stepValue(1, -1, 1, 8), 1);
  assert.equal(stepValue(10, -1, 0, 100, 5), 5);
  assert.equal(stepValue(98, 1, 0, 100, 5), 100);
  assert.equal(stepValue(20, -1, 1, 8), 7);
});

test('canStep is false at each bound', () => {
  assert.equal(canStep(1, -1, 1, 8), false);
  assert.equal(canStep(1, 1, 1, 8), true);
  assert.equal(canStep(8, 1, 1, 8), false);
});

test('time shifts wrap within the day', () => {
  const late = shiftTimeOfDay(new Date(2026, 9, 11, 23, 50), 15);
  assert.deepEqual([late.getDate(), late.getHours(), late.getMinutes()], [11, 0, 5]);
  const early = shiftTimeOfDay(new Date(2026, 9, 11, 0, 5), -15);
  assert.deepEqual([early.getDate(), early.getHours(), early.getMinutes()], [11, 23, 50]);
});

test('input values round-trip in local time', () => {
  const d = new Date(2026, 0, 5, 7, 30);
  assert.equal(toInputValue(d, 'date'), '2026-01-05');
  assert.equal(toInputValue(d, 'datetime'), '2026-01-05T07:30');
  assert.equal(fromInputValue('2026-01-05T07:30')?.getTime(), d.getTime());
  assert.equal(fromInputValue('nope'), null);
  assert.equal(toInputValue(null, 'date'), '');
});

test('month grid has full weeks and day differences count calendar days', () => {
  const weeks = monthGrid(new Date(2026, 1, 1));
  assert.ok(weeks.every((w) => w.length === 7));
  assert.equal(weeks.flat().filter(Boolean).length, 28);
  assert.equal(dayDifference(new Date(2026, 2, 7, 23), new Date(2026, 2, 9, 1)), 2);
});
