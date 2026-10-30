import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatCount,
  formatDate,
  formatMoney,
  formatRelative,
  formatSalaryRange,
  formatTimeRange,
  setFormatLocale,
} from '../src/format.ts';

setFormatLocale('en-US');

test('formatDate returns null for missing or invalid input', () => {
  assert.equal(formatDate(undefined), null);
  assert.equal(formatDate(''), null);
  assert.equal(formatDate('not a date'), null);
});

test('formatDate formats each style', () => {
  const iso = '2026-03-05T15:30:00Z';
  assert.match(formatDate(iso, 'medium'), /Mar 5, 2026/);
  assert.match(formatDate(iso, 'long'), /March 5, 2026/);
});

test('formatTimeRange joins start and end', () => {
  const range = formatTimeRange('2026-03-05T15:30:00', '2026-03-05T17:00:00');
  assert.match(range, /3:30\s?PM – 5:00\s?PM/);
  assert.equal(formatTimeRange(null), null);
});

test('formatMoney uses currency formatting and absolute option', () => {
  assert.equal(formatMoney(12.5), '$12.50');
  assert.equal(formatMoney(-4, 'USD', { absolute: true }), '$4.00');
  assert.match(formatMoney(10, 'EUR'), /€10\.00/);
  assert.match(formatMoney(10, 'ZZZ'), /ZZZ\s?10\.00/);
});

test('formatSalaryRange covers each bound and returns null when unlisted', () => {
  assert.equal(formatSalaryRange(80000, 120000), '$80K – $120K / yr');
  assert.equal(formatMoney(1250, 'USD', { compact: true }), '$1.3K');
  assert.equal(formatSalaryRange(90000, null), 'From $90K / yr');
  assert.equal(formatSalaryRange(null, 50000), 'Up to $50K / yr');
  assert.equal(formatSalaryRange(null, null), null);
});

test('formatRelative describes past and future', () => {
  const now = new Date('2026-03-05T12:00:00Z');
  assert.equal(formatRelative(new Date('2026-03-05T09:00:00Z'), now), '3 hours ago');
  assert.equal(formatRelative(new Date('2026-03-07T12:00:00Z'), now), 'in 2 days');
  assert.equal(formatRelative(new Date('2026-03-05T11:59:40Z'), now), 'just now');
});

test('formatCount is compact', () => {
  assert.equal(formatCount(1234), '1.2K');
  assert.equal(formatCount(12), '12');
});

test('formatRelative works without Intl.RelativeTimeFormat (Hermes)', () => {
  const original = Intl.RelativeTimeFormat;
  delete Intl.RelativeTimeFormat;
  try {
    const now = new Date('2026-03-05T12:00:00Z');
    assert.equal(formatRelative(new Date('2026-03-05T09:00:00Z'), now), '3 hours ago');
    assert.equal(formatRelative(new Date('2026-03-04T12:00:00Z'), now), 'yesterday');
    assert.equal(formatRelative(new Date('2026-03-07T12:00:00Z'), now), 'in 2 days');
  } finally {
    Intl.RelativeTimeFormat = original;
  }
});

test('compact numbers promote to the next unit instead of reaching 1000', () => {
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(999.6), '1K');
  assert.equal(formatCount(999_999), '1M');
  assert.equal(formatCount(1_250_000), '1.3M');
  assert.equal(formatCount(999_999_999_999), '1T');
  assert.equal(formatCount(-1500), '-1.5K');
  assert.equal(formatMoney(999_999, 'USD', { compact: true }), '$1M');
});
