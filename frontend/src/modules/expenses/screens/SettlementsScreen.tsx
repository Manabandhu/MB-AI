import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

type Settlement = {
  id: string;
  title: string;
  body: string;
  meta?: string;
};

type SettlementsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  settlements: Settlement[];
};

export function SettlementsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'settlements'],
    queryFn: async (): Promise<SettlementsContent> => {
      const response = await apiFetch('/api/v1/expenses/settlements');
      if (!response.ok) throw new Error(`Settlements failed: ${response.status}`);
      return response.json() as Promise<SettlementsContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading settlements..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load settlements"
          body="There was a problem loading settlements."
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
      {content.settlements.length === 0 ? (
        <EmptyState
          title="No pending settlements"
          body="All expenses are settled."
          actionLabel="View balances"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.settlements.map((settlement) => (
            <View key={settlement.id} style={styles.settlementCard}>
              <Text style={styles.settlementTitle}>{settlement.title}</Text>
              <Text style={styles.settlementBody}>{settlement.body}</Text>
              <Text style={styles.settlementMeta}>{settlement.meta}</Text>
            </View>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  settlementCard: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.x4,
    gap: space.x2,
  },
  settlementTitle: {
    color: color.ink,
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  settlementBody: { color: color.muted, fontSize: typography.body.fontSize },
  settlementMeta: {
    color: color.primary,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
    marginTop: space.x1,
  },
});
