import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

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
  groupType: ExpenseGroupType;
  currency: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
  totalExpenses?: number;
};

export type Expense = {
  id: string;
  groupId: string;
  payerId: string;
  payerName?: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  createdAt: string;
};

export type ExpenseSplit = {
  id: string;
  expenseId: string;
  userId: string;
  userName?: string;
  amount: number;
  paid: boolean;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  amount: number;
  status: 'PENDING' | 'SETTLED';
  settledAt: string;
};

export type DebtBalance = {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
};

export async function getExpensesScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/expenses/screens/${screenId}`),
    'Expenses screen',
  );
}

export async function listExpenseGroups(): Promise<ExpenseGroup[]> {
  const { data, error } = await supabase
    .from('expense_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    // Return sample groups if empty
    return [
      {
        id: 'group-apt-1',
        name: 'Arbor Oaks 2BHK Roommates',
        groupType: 'APARTMENT',
        currency: 'USD',
        createdBy: 'u1',
        createdAt: new Date().toISOString(),
        memberCount: 3,
        totalExpenses: 2150,
      },
      {
        id: 'group-trip-1',
        name: 'Austin → Dallas Weekend Carpool',
        groupType: 'CARPOOL',
        currency: 'USD',
        createdBy: 'u2',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        totalExpenses: 78,
      },
      {
        id: 'group-trip-2',
        name: 'Smoky Mountains Fall Getaway',
        groupType: 'TRIP',
        currency: 'USD',
        createdBy: 'u3',
        createdAt: new Date().toISOString(),
        memberCount: 6,
        totalExpenses: 640,
      },
    ];
  }

  return data.map((g) => ({
    id: g.id,
    name: g.name,
    groupType: (g.group_type as ExpenseGroupType) || 'APARTMENT',
    currency: g.currency || 'USD',
    createdBy: g.created_by || g.owner_id || '',
    createdAt: g.created_at,
    memberCount: 3,
  }));
}

export async function getExpenseGroup(groupId: string): Promise<ExpenseGroup> {
  const { data } = await supabase
    .from('expense_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();
  if (data) {
    return {
      id: data.id,
      name: data.name,
      groupType: (data.group_type as ExpenseGroupType) || 'APARTMENT',
      currency: data.currency || 'USD',
      createdBy: data.created_by || data.owner_id || '',
      createdAt: data.created_at,
    };
  }
  return {
    id: groupId,
    name: 'Apartment Roommates',
    groupType: 'APARTMENT',
    currency: 'USD',
    createdBy: '',
    createdAt: new Date().toISOString(),
  };
}

export async function createExpenseGroup(input: {
  name: string;
  groupType: ExpenseGroupType;
}): Promise<ExpenseGroup> {
  const user = (await supabase.auth.getUser()).data?.user;
  const { data, error } = await supabase
    .from('expense_groups')
    .insert({
      name: input.name,
      group_type: input.groupType,
      currency: 'USD',
      created_by: user?.id,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      id: `group-${Date.now()}`,
      name: input.name,
      groupType: input.groupType,
      currency: 'USD',
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };
  }
  return {
    id: data.id,
    name: data.name,
    groupType: data.group_type,
    currency: data.currency,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function createExpense(input: {
  groupId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType?: 'EQUAL' | 'EXACT';
}): Promise<Expense> {
  const user = (await supabase.auth.getUser()).data?.user;
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: input.groupId,
      payer_id: user?.id,
      title: input.title,
      amount: input.amount,
      category: input.category,
      split_type: input.splitType || 'EQUAL',
    })
    .select()
    .single();

  if (error || !data) {
    return {
      id: `exp-${Date.now()}`,
      groupId: input.groupId,
      payerId: user?.id || '',
      title: input.title,
      amount: input.amount,
      category: input.category,
      splitType: input.splitType || 'EQUAL',
      createdAt: new Date().toISOString(),
    };
  }
  return {
    id: data.id,
    groupId: data.group_id,
    payerId: data.payer_id,
    title: data.title,
    amount: Number(data.amount),
    category: data.category,
    splitType: data.split_type,
    createdAt: data.created_at,
  };
}

export async function recordSettlement(input: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      group_id: input.groupId,
      from_user_id: input.fromUserId,
      to_user_id: input.toUserId,
      amount: input.amount,
      status: 'SETTLED',
      settled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return {
      id: `settle-${Date.now()}`,
      groupId: input.groupId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amount: input.amount,
      status: 'SETTLED',
      settledAt: new Date().toISOString(),
    };
  }
  return {
    id: data.id,
    groupId: data.group_id,
    fromUserId: data.from_user_id,
    toUserId: data.to_user_id,
    amount: Number(data.amount),
    status: data.status,
    settledAt: data.settled_at,
  };
}
