import { apiFetch, parseJsonOrThrow } from '@/lib/api';

// All expense data goes through the backend, which enforces group membership. Errors are surfaced to the
// screens instead of being replaced with sample data, so a failed save is never shown as a success.

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WIFI'
  | 'GROCERIES'
  | 'GAS_TOLLS'
  | 'GENERAL';

export type ExpenseGroupType = 'APARTMENT' | 'TRIP' | 'CARPOOL' | 'EVENT';

export type ExpenseGroup = {
  id: string;
  name: string;
  description?: string | null;
  groupType: ExpenseGroupType;
  currency: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  totalExpenses: number;
};

export type Expense = {
  id: string;
  groupId: string;
  payerId: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  expenseDate: string;
  createdAt: string;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  settledAt: string | null;
  createdAt: string;
};

export type DebtBalance = {
  groupId: string;
  groupName: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
};

type RawExpense = Omit<Expense, 'amount' | 'title'> & {
  amount: number | string;
  title?: string | null;
};
type RawGroup = Omit<ExpenseGroup, 'totalExpenses'> & { totalExpenses: number | string };
type RawAmount<T> = Omit<T, 'amount'> & { amount: number | string };

const toGroup = (g: RawGroup): ExpenseGroup => ({ ...g, totalExpenses: Number(g.totalExpenses) });
const toExpense = (e: RawExpense): Expense => ({
  ...e,
  amount: Number(e.amount),
  title: e.title || e.description || 'Expense',
});
const withAmount = <T>(row: RawAmount<T>): T => ({ ...row, amount: Number(row.amount) }) as T;

export async function listExpenseGroups(): Promise<ExpenseGroup[]> {
  const groups = await parseJsonOrThrow<RawGroup[]>(
    await apiFetch('/api/v1/expenses/groups'),
    'Expense groups',
  );
  return groups.map(toGroup);
}

export async function getExpenseGroup(groupId: string): Promise<ExpenseGroup> {
  return toGroup(
    await parseJsonOrThrow<RawGroup>(
      await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}`),
      'Expense group',
    ),
  );
}

export async function createExpenseGroup(input: {
  name: string;
  groupType: ExpenseGroupType;
  description?: string;
}): Promise<ExpenseGroup> {
  return toGroup(
    await parseJsonOrThrow<RawGroup>(
      await apiFetch('/api/v1/expenses/groups', { method: 'POST', body: JSON.stringify(input) }),
      'Create expense group',
    ),
  );
}

export async function listGroupExpenses(groupId: string): Promise<Expense[]> {
  const expenses = await parseJsonOrThrow<RawExpense[]>(
    await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/expenses`),
    'Group expenses',
  );
  return expenses.map(toExpense);
}

export async function createExpense(input: {
  groupId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType?: 'EQUAL' | 'EXACT';
  /** Local calendar date `YYYY-MM-DD`; the server's default (UTC today) can be a different day. */
  expenseDate?: string;
}): Promise<Expense> {
  const { groupId, ...body } = input;
  return toExpense(
    await parseJsonOrThrow<RawExpense>(
      await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ ...body, splitType: body.splitType ?? 'EQUAL' }),
      }),
      'Record expense',
    ),
  );
}

export async function listBalances(): Promise<DebtBalance[]> {
  const balances = await parseJsonOrThrow<RawAmount<DebtBalance>[]>(
    await apiFetch('/api/v1/expenses/balances'),
    'Balances',
  );
  return balances.map((b) => withAmount<DebtBalance>(b));
}

/** Every open pairwise balance in one group (members only). */
export async function listGroupBalances(groupId: string): Promise<DebtBalance[]> {
  const balances = await parseJsonOrThrow<RawAmount<DebtBalance>[]>(
    await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/balances`),
    'Group balances',
  );
  return balances.map((b) => withAmount<DebtBalance>(b));
}

export async function listSettlements(): Promise<Settlement[]> {
  const settlements = await parseJsonOrThrow<RawAmount<Settlement>[]>(
    await apiFetch('/api/v1/expenses/settlements'),
    'Settlements',
  );
  return settlements.map((s) => withAmount<Settlement>(s));
}

export async function recordSettlement(input: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}): Promise<Settlement> {
  const { groupId, ...body } = input;
  return withAmount<Settlement>(
    await parseJsonOrThrow<RawAmount<Settlement>>(
      // The server decides the status: a payer's record stays pending until the recipient confirms it.
      await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/settlements`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
      'Record settlement',
    ),
  );
}

/** The recipient confirms (`completed`) a pending payment; either party may cancel it. */
export async function updateSettlementStatus(
  settlementId: string,
  status: 'completed' | 'cancelled',
): Promise<Settlement> {
  return withAmount<Settlement>(
    await parseJsonOrThrow<RawAmount<Settlement>>(
      await apiFetch(`/api/v1/expenses/settlements/${encodeURIComponent(settlementId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
      'Update settlement',
    ),
  );
}

/** Member user ids of a group (any member may read them). */
export async function listGroupMembers(groupId: string): Promise<string[]> {
  return parseJsonOrThrow<string[]>(
    await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/members`),
    'Group members',
  );
}

/** Owner only: adds a member by user id and returns the updated member ids. */
export async function addGroupMember(groupId: string, userId: string): Promise<string[]> {
  return parseJsonOrThrow<string[]>(
    await apiFetch(`/api/v1/expenses/groups/${encodeURIComponent(groupId)}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    'Add member',
  );
}

/**
 * The owner removes a member, or a member leaves (pass your own id). The owner cannot leave, and anyone with an open
 * balance in the group gets a 409 until it is settled.
 */
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const response = await apiFetch(
    `/api/v1/expenses/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
  if (!response.ok) await parseJsonOrThrow(response, 'Remove member');
}

/** Short, stable label for a member until the app has a profile directory. */
export function memberLabel(userId: string, currentUserId: string | undefined): string {
  return userId === currentUserId ? 'You' : `Member ${userId.slice(0, 4).toUpperCase()}`;
}
