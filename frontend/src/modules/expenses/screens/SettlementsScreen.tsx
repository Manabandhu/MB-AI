import { color, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { listSettlements, memberLabel, type Settlement } from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const STATUS_LABEL: Record<Settlement['status'], string> = {
  completed: 'Settled',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

export function SettlementsScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'settlements'],
    queryFn: listSettlements,
  });
  const name = (userId: string) => memberLabel(userId, currentUserId);

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
          body="There was a problem loading your settlement history."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const settlements = data;

  return (
    <ScreenShell>
      <SectionHeader
        eyebrow="AUDIT TRAIL"
        subtitle="Complete history of debt settlements and direct transfers."
        title="Settlement History"
      />

      {settlements.length === 0 ? (
        <EmptyState
          actionLabel="View Balances"
          body="No settlements have been recorded yet."
          onAction={() => router.push('/expenses/balances')}
          title="No settlements yet"
        />
      ) : (
        <View style={styles.list}>
          {settlements.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.statusBadge}>
                  <AppIcon color="#16a34a" name="check" size={14} />
                  <Text style={styles.statusText}>{STATUS_LABEL[s.status] ?? s.status}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(s.settledAt ?? s.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.contentRow}>
                <View style={styles.iconCircle}>
                  <AppIcon color={color.primary} name="wallet" size={20} />
                </View>
                <View style={styles.details}>
                  <Text style={styles.participants}>
                    <Text style={styles.strong}>{name(s.fromUserId)}</Text> paid{' '}
                    <Text style={styles.strong}>{name(s.toUserId)}</Text>
                  </Text>
                  <Text style={styles.subtext}>Recorded payment</Text>
                </View>
                <Text style={styles.amountText}>${s.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <AppButton label="View Current Balances" route="/expenses/balances" />
        <AppButton label="Back to Expenses" route="/expenses" variant="secondary" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700' },
  list: { gap: space.x3, marginTop: space.x4 },
  actions: { marginTop: space.x6, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22,163,74,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(67,30,190,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1 },
  participants: { fontSize: 14, color: color.ink },
  subtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amountText: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
});
