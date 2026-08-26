import { useQuery } from '@tanstack/react-query';
import { getExpensesScreen } from '@/modules/expenses/api';
import { expenseScreenFallbacks } from '@/modules/expenses/expensesFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type ExpensesScreenProps = {
  screenId: keyof typeof expenseRoutes;
};

export function ExpensesScreen({ screenId }: ExpensesScreenProps) {
  const fallback = expenseScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['expenses', 'screen', screenId],
    queryFn: () => getExpensesScreen(screenId),
  });
  const data = screen.data ?? fallback;

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
