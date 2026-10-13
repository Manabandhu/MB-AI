import { radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { getExpenseGroup, listGroupExpenses, memberLabel } from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

type GroupDetailsScreenProps = {
  groupId: string;
};

export function GroupDetailsScreen({ groupId }: GroupDetailsScreenProps) {
  const { styles } = useScreenStyles(createScreenStyles);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const group = useQuery({
    queryKey: ['expenses', 'group', groupId],
    queryFn: () => getExpenseGroup(groupId),
    enabled: !!groupId,
  });
  const expenses = useQuery({
    queryKey: ['expenses', 'group', groupId, 'expenses'],
    queryFn: () => listGroupExpenses(groupId),
    enabled: !!groupId,
  });

  if (group.isLoading || expenses.isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading details..." />
      </ScreenShell>
    );
  }

  if (group.error || expenses.error || !group.data || !expenses.data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load group"
          body="This group does not exist or you are not a member of it."
          retryLabel="Retry"
          onRetry={() => {
            group.refetch();
            expenses.refetch();
          }}
        />
      </ScreenShell>
    );
  }

  const info = group.data;
  const symbol = info.currency === 'USD' ? '$' : `${info.currency} `;

  return (
    <ScreenShell>
      <SectionHeader
        eyebrow={info.groupType.toLowerCase()}
        title={info.name}
        subtitle={`${info.memberCount} ${info.memberCount === 1 ? 'member' : 'members'} · ${symbol}${info.totalExpenses.toFixed(2)} spent`}
      />
      {expenses.data.length === 0 ? (
        <EmptyState
          title="No expenses"
          body="Add your first expense to get started."
          actionLabel="Refresh"
          onAction={() => expenses.refetch()}
        />
      ) : (
        <View style={styles.list}>
          {expenses.data.map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.title}>{expense.title}</Text>
                <Text style={styles.meta}>
                  Paid by {memberLabel(expense.payerId, currentUserId)} · {expense.expenseDate}
                </Text>
              </View>
              <Text style={styles.amount}>
                {symbol}
                {expense.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <AppButton label="Add expense" route={`/expenses/add?groupId=${groupId}`} />
        <AppButton label="Balances" route="/expenses/balances" variant="secondary" />
        <AppButton label="Settlements" route="/expenses/settlements" variant="secondary" />
      </View>
    </ScreenShell>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    list: { gap: space.x3, marginTop: space.x4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.x3,
      padding: space.x4,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    rowText: { flex: 1, gap: space.x1 },
    title: { ...typography.bodyStrong, color: palette.ink },
    meta: { ...typography.caption, color: palette.muted },
    amount: { ...typography.h4, color: palette.ink },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x6 },
  });
};
