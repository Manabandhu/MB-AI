import { useQuery } from '@tanstack/react-query';
import { getExpensesScreen } from '@/modules/expenses/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';

type ExpensesScreenProps = {
  screenId: keyof typeof expenseRoutes;
};

export function ExpensesScreen({ screenId }: ExpensesScreenProps) {
  const screen = useQuery({
    queryKey: ['expenses', 'screen', screenId],
    queryFn: () => getExpensesScreen(screenId),
  });

  if (screen.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  if (screen.isError || !screen.data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load expenses"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => screen.refetch()}
        />
      </ScreenShell>
    );
  }

  const data = screen.data;

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
