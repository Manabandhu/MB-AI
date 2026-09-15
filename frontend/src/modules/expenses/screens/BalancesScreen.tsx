import { color, radius, space } from '@manabandhu/design-system';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { type DebtBalance, recordSettlement } from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const INITIAL_BALANCES: DebtBalance[] = [
  {
    fromUserId: 'u-vikram',
    fromUserName: 'Vikram Reddy',
    toUserId: 'u-current',
    toUserName: 'You',
    amount: 45.0,
  },
  {
    fromUserId: 'u-current',
    fromUserName: 'You',
    toUserId: 'u-sneha',
    toUserName: 'Sneha Murthy',
    amount: 28.5,
  },
  {
    fromUserId: 'u-karthik',
    fromUserName: 'Karthik Varma',
    toUserId: 'u-current',
    toUserName: 'You',
    amount: 62.0,
  },
  {
    fromUserId: 'u-ananya',
    fromUserName: 'Ananya Rao',
    toUserId: 'u-current',
    toUserName: 'You',
    amount: 15.0,
  },
];

export function BalancesScreen() {
  const router = useRouter();
  const [balances, setBalances] = useState<DebtBalance[]>(INITIAL_BALANCES);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const handleSettleUp = async (b: DebtBalance) => {
    const key = `${b.fromUserId}-${b.toUserId}`;
    setSettlingId(key);
    try {
      await recordSettlement({
        groupId: 'group-apt-1',
        fromUserId: b.fromUserId,
        toUserId: b.toUserId,
        amount: b.amount,
      });

      // Zero out debt in local balance matrix
      setBalances((prev) =>
        prev.filter((item) => !(item.fromUserId === b.fromUserId && item.toUserId === b.toUserId)),
      );

      Alert.alert(
        'Settled Up! 🎉',
        `Payment of $${b.amount.toFixed(2)} between ${b.fromUserName} and ${b.toUserName} has been marked as settled.`,
      );
    } catch {
      Alert.alert('Error', 'Unable to record settlement.');
    } finally {
      setSettlingId(null);
    }
  };

  const totalOwedToYou = balances
    .filter((b) => b.toUserName === 'You')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalYouOwe = balances
    .filter((b) => b.fromUserName === 'You')
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
            const isOwedToMe = b.toUserName === 'You';
            const isSettling = settlingId === `${b.fromUserId}-${b.toUserId}`;
            return (
              <View key={`${b.fromUserId}-${b.toUserId}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarPill}>
                    <Text style={styles.avatarPillText}>
                      {b.fromUserName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardMiddle}>
                    <Text style={styles.cardTitle}>
                      <Text style={{ fontWeight: '700' }}>{b.fromUserName}</Text> owes{' '}
                      <Text style={{ fontWeight: '700' }}>{b.toUserName}</Text>
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
                  <Text style={styles.auditText}>Group: Arbor Oaks 2BHK</Text>
                  <Pressable
                    accessibilityLabel={`Settle up $${b.amount.toFixed(2)} with ${b.fromUserName}`}
                    accessibilityRole="button"
                    disabled={isSettling}
                    onPress={() => handleSettleUp(b)}
                    style={styles.settleBtn}
                  >
                    <AppIcon color="#431ebe" name="check" size={14} />
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

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  summaryCardGreen: {
    flex: 1,
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  summaryLabelGreen: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  summaryValueGreen: { fontSize: 20, fontWeight: '800', color: '#16a34a', marginTop: 4 },
  summaryCardRed: {
    flex: 1,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 14,
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
    borderColor: color.border,
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
  avatarPillText: { fontSize: 13, fontWeight: '700', color: color.primary },
  cardMiddle: { flex: 1 },
  cardTitle: { fontSize: 14, color: color.ink },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleBtnText: { fontSize: 12, fontWeight: '700', color: color.primary },
});
