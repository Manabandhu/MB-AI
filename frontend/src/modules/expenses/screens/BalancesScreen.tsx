import { radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import {
  type DebtBalance,
  listBalances,
  memberLabel,
  recordSettlement,
} from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

const balanceKey = (b: DebtBalance) => `${b.groupId}-${b.fromUserId}-${b.toUserId}`;

export function BalancesScreen() {
  const { styles, palette } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'balances'],
    queryFn: listBalances,
  });
  const settle = useMutation({
    mutationFn: (b: DebtBalance) =>
      recordSettlement({
        groupId: b.groupId,
        fromUserId: b.fromUserId,
        toUserId: b.toUserId,
        amount: b.amount,
      }),
    onSuccess: (settlement, b) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (settlement.status === 'completed') {
        Alert.alert(
          'Settled up',
          `Payment of $${b.amount.toFixed(2)} from ${name(b.fromUserId)} to ${name(b.toUserId)} has been recorded.`,
        );
      } else {
        Alert.alert(
          'Waiting for confirmation',
          `${name(b.toUserId)} needs to confirm they received $${b.amount.toFixed(2)}. The balance updates once they do.`,
        );
      }
    },
    onError: (err) => Alert.alert('Unable to record settlement', err.message),
  });
  const name = (userId: string) => memberLabel(userId, currentUserId);
  const settlingId = settle.isPending && settle.variables ? balanceKey(settle.variables) : null;

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
          body="There was a problem loading who owes whom."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const balances = data;
  const totalOwedToYou = balances
    .filter((b) => b.toUserId === currentUserId)
    .reduce((sum, b) => sum + b.amount, 0);
  const totalYouOwe = balances
    .filter((b) => b.fromUserId === currentUserId)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <ScreenShell>
      <SectionHeader
        eyebrow="DEBT SIMPLIFICATION"
        subtitle="Optimized pairwise balances across roommates and carpools."
        title="Who Owes Whom"
      />

      {/* Quick Summary Strip */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCardGreen}>
          <Text style={styles.summaryLabelGreen}>You are owed</Text>
          <Text style={styles.summaryValueGreen}>${totalOwedToYou.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCardRed}>
          <Text style={styles.summaryLabelRed}>You owe</Text>
          <Text style={styles.summaryValueRed}>${totalYouOwe.toFixed(2)}</Text>
        </View>
      </View>

      {balances.length === 0 ? (
        <EmptyState
          actionLabel="View Activity"
          body="All shared costs are completely zeroed out!"
          onAction={() => router.push('/expenses')}
          title="All Settled Up!"
        />
      ) : (
        <View style={styles.list}>
          {balances.map((b) => {
            const isOwedToMe = b.toUserId === currentUserId;
            const isSettling = settlingId === balanceKey(b);
            return (
              <View key={balanceKey(b)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarPill}>
                    <Text style={styles.avatarPillText}>
                      {name(b.fromUserId).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardMiddle}>
                    <Text style={styles.cardTitle}>
                      <Text style={styles.strong}>{name(b.fromUserId)}</Text>{' '}
                      {b.fromUserId === currentUserId ? 'owe' : 'owes'}{' '}
                      <Text style={styles.strong}>{name(b.toUserId)}</Text>
                    </Text>
                    <Text style={styles.cardSub}>
                      {isOwedToMe ? 'Will be transferred to you' : 'Direct payment via Zelle / UPI'}
                    </Text>
                  </View>
                  <Text style={[styles.amountText, { color: isOwedToMe ? '#16a34a' : '#dc2626' }]}>
                    ${b.amount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <Text style={styles.auditText}>Group: {b.groupName}</Text>
                  <Pressable
                    accessibilityLabel={`Settle up $${b.amount.toFixed(2)} with ${name(b.fromUserId)}`}
                    accessibilityRole="button"
                    disabled={isSettling}
                    onPress={() => settle.mutate(b)}
                    style={styles.settleBtn}
                  >
                    <AppIcon color={palette.primary} name="check" size={14} />
                    <Text style={styles.settleBtnText}>
                      {isSettling ? 'Settling...' : 'Settle Up'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          label="View Settlement History"
          route="/expenses/settlements"
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      marginBottom: 8,
    },
    summaryCardGreen: {
      flex: 1,
      backgroundColor: 'rgba(22,163,74,0.08)',
      borderRadius: radius.control,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(22,163,74,0.2)',
    },
    summaryLabelGreen: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
    summaryValueGreen: { fontSize: 20, fontWeight: '800', color: '#16a34a', marginTop: 4 },
    summaryCardRed: {
      flex: 1,
      backgroundColor: 'rgba(220,38,38,0.08)',
      borderRadius: radius.control,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.2)',
    },
    summaryLabelRed: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
    summaryValueRed: { fontSize: 20, fontWeight: '800', color: '#dc2626', marginTop: 4 },
    list: { gap: space.x3, marginTop: space.x4 },
    actions: { marginTop: space.x6 },
    card: {
      backgroundColor: '#fff',
      borderColor: palette.border,
      borderRadius: radius.card,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarPill: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(67,30,190,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPillText: { fontSize: 13, fontWeight: '700', color: palette.primary },
    cardMiddle: { flex: 1 },
    cardTitle: { fontSize: 14, color: palette.ink },
    strong: { fontWeight: '700' },
    cardSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    amountText: { fontSize: 16, fontWeight: '800' },
    cardDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    auditText: { fontSize: 11, color: '#9ca3af' },
    settleBtn: {
      minHeight: 44,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(67,30,190,0.08)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    settleBtnText: { fontSize: 12, fontWeight: '700', color: palette.primary },
  });
};
