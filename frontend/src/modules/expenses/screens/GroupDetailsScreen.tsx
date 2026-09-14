import { space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Expense = {
  id: string;
  title: string;
  body: string;
  meta?: string;
};

type GroupDetailsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  expenses: Expense[];
};

type GroupDetailsScreenProps = {
  groupId: string;
};

export function GroupDetailsScreen({ groupId }: GroupDetailsScreenProps) {
  const _colorScheme = useColorScheme();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'group', groupId],
    queryFn: async (): Promise<GroupDetailsContent> => {
      const response = await apiFetch(`/api/v1/expenses/groups/${groupId}`);
      if (!response.ok) throw new Error(`Group failed: ${response.status}`);
      return response.json() as Promise<GroupDetailsContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading details..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load group"
          body="There was a problem loading this expense group."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.expenses.length === 0 ? (
        <EmptyState
          title="No expenses"
          body="Add your first expense to get started."
          actionLabel="Add expense"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.expenses.map((expense) => (
            <AppButton
              key={expense.id}
              label={expense.title}
              route={`/expenses/groups/${groupId}`}
              variant="secondary"
            />
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <AppButton label="Add expense" route="/expenses/add" />
        <AppButton label="View settlements" route="/expenses/settlements" variant="secondary" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x6 },
});
