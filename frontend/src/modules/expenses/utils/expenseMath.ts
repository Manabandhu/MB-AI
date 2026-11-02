/** Pure expense helpers; tested by `frontend/test/expenseMath.test.mjs`. No React or path aliases here. */

/** The server stores amounts as DECIMAL(10,2): at most 8 integer digits. */
export const MAX_AMOUNT = 99_999_999.99;

export type AmountResult = { value: number; error: null } | { value: null; error: string };

/**
 * Strictly parses a typed amount. Accepts "12", "12.5", "12.50", ".5", and grouped thousands like "1,000.25";
 * rejects letters, signs, several dots, or badly placed commas ("12abc", "1,00", "-3"). Rounds to cents (half up).
 */
export function parseAmount(input: string): AmountResult {
  const raw = String(input ?? '').trim();
  if (!raw) return { value: null, error: 'Enter an amount.' };
  const plain = /^(\d+(\.\d*)?|\.\d+)$/;
  const grouped = /^\d{1,3}(,\d{3})+(\.\d*)?$/;
  if (!plain.test(raw) && !grouped.test(raw)) {
    return { value: null, error: 'Use numbers only, like 24.50 or 1,200.' };
  }
  const parsed = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return { value: null, error: 'Use numbers only, like 24.50.' };
  const cents = Math.round((parsed + Number.EPSILON) * 100) / 100;
  if (cents <= 0) return { value: null, error: 'Enter an amount greater than zero.' };
  if (cents > MAX_AMOUNT) return { value: null, error: 'That amount is too large.' };
  return { value: cents, error: null };
}

/** Expense categories the backend accepts, keyed by id; the label is only for display. */
export const EXPENSE_CATEGORIES = [
  { id: 'GROCERIES', label: 'Groceries', icon: 'marketplace' },
  { id: 'RENT', label: 'Rent', icon: 'home' },
  { id: 'ELECTRICITY', label: 'Electricity', icon: 'zap' },
  { id: 'WIFI', label: 'Wi-Fi & internet', icon: 'globe' },
  { id: 'GAS_TOLLS', label: 'Gas & tolls', icon: 'car' },
  { id: 'GENERAL', label: 'Other', icon: 'receipt' },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id'];

export function categoryLabel(id: string | null | undefined): string {
  const match = EXPENSE_CATEGORIES.find((c) => c.id === String(id ?? '').toUpperCase());
  return match?.label ?? 'Other';
}

type Amount = { amount: number; currency: string };

/** Signed sums keyed by currency; amounts in different currencies are never added together. */
export function sumByCurrency(rows: readonly Amount[], sign = 1): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const currency = String(row.currency || '').toUpperCase() || 'USD';
    totals.set(currency, round2((totals.get(currency) ?? 0) + sign * row.amount));
  }
  return totals;
}

/** Net per currency: what others owe you minus what you owe; zero (under half a cent) entries are dropped. */
export function netByCurrency(
  balances: readonly (Amount & { fromUserId: string; toUserId: string })[],
  currentUserId: string | undefined,
): Map<string, number> {
  const net = new Map<string, number>();
  for (const b of balances) {
    const sign = b.toUserId === currentUserId ? 1 : b.fromUserId === currentUserId ? -1 : 0;
    if (!sign) continue;
    const currency = String(b.currency || '').toUpperCase() || 'USD';
    net.set(currency, round2((net.get(currency) ?? 0) + sign * b.amount));
  }
  for (const [currency, amount] of net) if (Math.abs(amount) < 0.005) net.delete(currency);
  return net;
}

/** UUID check for ids typed or pasted by hand (member ids). */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

/** Settlement status label and badge tone, case-insensitively. */
export function settlementStatus(status: string | null | undefined): {
  key: 'pending' | 'completed' | 'cancelled' | 'other';
  label: string;
  tone: 'warning' | 'success' | 'neutral';
} {
  switch (String(status ?? '').toLowerCase()) {
    case 'pending':
      return { key: 'pending', label: 'Awaiting confirmation', tone: 'warning' };
    case 'completed':
      return { key: 'completed', label: 'Settled', tone: 'success' };
    case 'cancelled':
      return { key: 'cancelled', label: 'Cancelled', tone: 'neutral' };
    default:
      return { key: 'other', label: String(status ?? ''), tone: 'neutral' };
  }
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** A server `LocalDate` ("2026-10-13") as local midnight, so it never shows as the previous day west of UTC. */
export function localDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Today (or `date`) as a local calendar date `YYYY-MM-DD`, for the server's `LocalDate` fields. */
export function toLocalDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when the member owes or is owed anything in the group (any pair, even if their net is zero). */
export function hasOpenBalance(
  balances: readonly { fromUserId: string; toUserId: string; amount: number }[],
  userId: string,
): boolean {
  return balances.some(
    (b) => Math.abs(b.amount) >= 0.005 && (b.fromUserId === userId || b.toUserId === userId),
  );
}
