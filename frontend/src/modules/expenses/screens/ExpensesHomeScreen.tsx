import { useQuery } from '@tanstack/react-query';
import { getExpensesScreen } from '@/modules/expenses/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

type ExpensesScreenProps = {
  screenId: keyof typeof expenseRoutes;
};

const DEFAULT_EXPENSES_DATA: Record<string, CatalogScreenContent> = {
  home: {
    title: 'Split expenses with trust',
    subtitle: 'Track shared expenses, balances, and settlements across groups and trips.',
    eyebrow: 'Expenses',
    metrics: [
      { label: 'Active groups', value: '4' },
      { label: 'Outstanding', value: '$186.50' },
    ],
    items: [
      { id: 'groups', title: 'Your groups', body: 'Open groups you belong to with live balances.', meta: 'Groups', route: '/expenses/groups' },
      { id: 'balances', title: 'Who owes whom', body: 'See net balances and settlement suggestions.', meta: 'Balances', route: '/expenses/balances' },
    ],
  },
  groups: {
    title: 'Your expense groups',
    subtitle: 'Flatmates, road trips, and shared groceries in Austin.',
    eyebrow: 'Expense Groups',
    metrics: [
      { label: 'Total groups', value: '3' },
      { label: 'Settled', value: '12' },
    ],
    items: [
      { id: 'apt-402', title: 'Apt 402 Utilities', body: 'Austin TX · 4 flatmates · Water, Gas & Internet', meta: 'Monthly', route: '/expenses/groups' },
      { id: 'dallas-trip', title: 'Dallas Diwali Roadtrip', body: 'Carpool & Gas split · 3 members', meta: 'Recent', route: '/expenses/groups' },
    ],
  },
  balances: {
    title: 'Balances & Settlements',
    subtitle: 'Track who owes whom with automatic net-settlement calculation.',
    eyebrow: 'Net Balances',
    metrics: [
      { label: 'You owe', value: '$45.00' },
      { label: 'You are owed', value: '$120.00' },
    ],
    items: [
      { id: 'b1', title: 'Ravi Teja owes you $75.00', body: 'Groceries at Patel Brothers', meta: 'Pending', route: '/expenses/settlements' },
      { id: 'b2', title: 'You owe Priya $45.00', body: 'Gas on I-35 carpool', meta: 'Due', route: '/expenses/settlements' },
    ],
  },
  settlements: {
    title: 'Past Settlements',
    subtitle: 'History of completed transfers via Zelle and Venmo.',
    eyebrow: 'Settlements',
    metrics: [
      { label: 'Total settled', value: '$1,420' },
      { label: 'This month', value: '$240' },
    ],
    items: [
      { id: 's1', title: 'Settled $120.00 with Suresh', body: 'Paid via Zelle · Oct 2', meta: 'Completed', route: '/expenses/balances' },
    ],
  },
  add: {
    title: 'Add New Expense',
    subtitle: 'Record a receipt, split by percentages or equal shares.',
    eyebrow: 'New Expense',
    metrics: [],
    items: [
      { id: 'quick-split', title: 'Equal Split', body: 'Divide total equally among group members.', meta: 'Standard', route: '/expenses/groups' },
    ],
  },
};

export function ExpensesScreen({ screenId }: ExpensesScreenProps) {
  const screen = useQuery({
    queryKey: ['expenses', 'screen', screenId],
    queryFn: () => getExpensesScreen(screenId),
    retry: false,
  });

  if (screen.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  const data = screen.data ?? DEFAULT_EXPENSES_DATA[screenId] ?? DEFAULT_EXPENSES_DATA.home;

  return (
    <FeatureScreen
      actions={expenseActions[screenId]}
      cards={data.items}
      currentRoute={expenseRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const expenseRoutes = {
  home: '/expenses',
  groups: '/expenses/groups',
  balances: '/expenses/balances',
  settlements: '/expenses/settlements',
  add: '/expenses/add',
} as const;

const expenseActions = {
  home: [
    { label: 'Groups', route: '/expenses/groups' },
    { label: 'Add expense', route: '/expenses/add' },
    { label: 'Balances', route: '/expenses/balances' },
    { label: 'Settlements', route: '/expenses/settlements' },
  ],
  groups: [
    { label: 'Add expense', route: '/expenses/add' },
    { label: 'Balances', route: '/expenses/balances' },
  ],
  balances: [
    { label: 'Settlements', route: '/expenses/settlements' },
    { label: 'Groups', route: '/expenses/groups' },
  ],
  settlements: [
    { label: 'Balances', route: '/expenses/balances' },
    { label: 'Groups', route: '/expenses/groups' },
  ],
  add: [
    { label: 'Groups', route: '/expenses/groups' },
    { label: 'Home', route: '/expenses' },
  ],
} as const;
