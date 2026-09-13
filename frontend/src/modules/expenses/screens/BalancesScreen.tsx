import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Balance = {
  id: string;
  title: string;
  body: string;
  meta?: string;
};

type BalancesContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  balances: Balance[];
};

export function BalancesScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'balances'],
    queryFn: async (): Promise<BalancesContent> => {
      const response = await apiFetch('/api/v1/expenses/balances');
      if (!response.ok) throw new Error(`Balances failed: ${response.status}`);
      return response.json() as Promise<BalancesContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading balances..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load balances"
          body="There was a problem loading your balances."
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
      {content.balances.length === 0 ? (
        <EmptyState
          title="No balances"
          body="You are all settled up across groups."
          actionLabel="View groups"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.balances.map((balance) => (
            <View key={balance.id} style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>{balance.title}</Text>
              <Text style={styles.balanceBody}>{balance.body}</Text>
              <Text style={styles.balanceMeta}>{balance.meta}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <AppButton label="Settle up" route="/expenses/settlements" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  actions: { marginTop: space.x6 },
  balanceCard: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.x4,
    gap: space.x2,
  },
  balanceTitle: {
    color: color.ink,
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  balanceBody: { color: color.muted, fontSize: typography.body.fontSize },
  balanceMeta: {
    color: color.primary,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
    marginTop: space.x1,
  },
});
