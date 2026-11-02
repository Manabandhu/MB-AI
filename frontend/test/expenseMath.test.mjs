import assert from 'node:assert/strict';
import test from 'node:test';
import {
  categoryLabel,
  isUuid,
  localDate,
  netByCurrency,
  parseAmount,
  settlementStatus,
  sumByCurrency,
} from '../src/modules/expenses/utils/expenseMath.ts';

test('parseAmount accepts plain and grouped numbers and rounds to cents', () => {
  assert.deepEqual(parseAmount('12'), { value: 12, error: null });
  assert.deepEqual(parseAmount(' 12.5 '), { value: 12.5, error: null });
  assert.deepEqual(parseAmount('.5'), { value: 0.5, error: null });
  assert.deepEqual(parseAmount('12.'), { value: 12, error: null });
  assert.deepEqual(parseAmount('1,000'), { value: 1000, error: null });
  assert.deepEqual(parseAmount('1,234,567.891'), { value: 1234567.89, error: null });
  assert.deepEqual(parseAmount('10.005'), { value: 10.01, error: null });
  assert.deepEqual(parseAmount('0.004').value, null);
});

test('parseAmount rejects junk, signs, bad grouping, zero, and overflow', () => {
  for (const bad of [
    '',
    ' ',
    '12abc',
    'abc',
    '-3',
    '+3',
    '1,00',
    '12,34.5',
    '1.2.3',
    '.',
    '1e3',
    '$5',
  ]) {
    assert.equal(parseAmount(bad).value, null, `expected ${JSON.stringify(bad)} to be rejected`);
    assert.ok(parseAmount(bad).error);
  }
  assert.equal(parseAmount('0').value, null);
  assert.equal(parseAmount('100000000').value, null);
  assert.equal(parseAmount('99999999.99').value, 99999999.99);
});

test('sumByCurrency and netByCurrency never mix currencies', () => {
  const totals = sumByCurrency([
    { amount: 10, currency: 'USD' },
    { amount: 5.1, currency: 'usd' },
    { amount: 300, currency: 'INR' },
  ]);
  assert.deepEqual(
    [...totals.entries()],
    [
      ['USD', 15.1],
      ['INR', 300],
    ],
  );
  const net = netByCurrency(
    [
      { amount: 20, currency: 'USD', fromUserId: 'a', toUserId: 'me' },
      { amount: 20, currency: 'USD', fromUserId: 'me', toUserId: 'b' },
      { amount: 50, currency: 'INR', fromUserId: 'me', toUserId: 'b' },
      { amount: 99, currency: 'EUR', fromUserId: 'x', toUserId: 'y' },
    ],
    'me',
  );
  assert.deepEqual([...net.entries()], [['INR', -50]]);
});

test('category labels map by id and statuses compare case-insensitively', () => {
  assert.equal(categoryLabel('WIFI'), 'Wi-Fi & internet');
  assert.equal(categoryLabel('gas_tolls'), 'Gas & tolls');
  assert.equal(categoryLabel('unknown'), 'Other');
  assert.equal(settlementStatus('PENDING').key, 'pending');
  assert.equal(settlementStatus('completed').label, 'Settled');
  assert.equal(settlementStatus('Cancelled').tone, 'neutral');
});

test('isUuid and localDate', () => {
  assert.ok(isUuid('3f2a1c9e-1234-4abc-8def-0123456789ab'));
  assert.ok(!isUuid('3f2a1c9e'));
  const d = localDate('2026-10-13');
  assert.equal(d?.getFullYear(), 2026);
  assert.equal(d?.getMonth(), 9);
  assert.equal(d?.getDate(), 13);
  assert.equal(localDate(''), null);
});

test('hasOpenBalance and toLocalDateString', async () => {
  const { hasOpenBalance, toLocalDateString } = await import(
    '../src/modules/expenses/utils/expenseMath.ts'
  );
  const rows = [{ fromUserId: 'a', toUserId: 'b', amount: 5 }];
  assert.ok(hasOpenBalance(rows, 'a'));
  assert.ok(hasOpenBalance(rows, 'b'));
  assert.ok(!hasOpenBalance(rows, 'c'));
  assert.ok(!hasOpenBalance([{ fromUserId: 'a', toUserId: 'b', amount: 0.001 }], 'a'));
  assert.equal(toLocalDateString(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
