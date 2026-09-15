import { color, radius, space } from '@manabandhu/design-system';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Settlement } from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const SAMPLE_SETTLEMENTS: Settlement[] = [
  {
    id: 'settle-1',
    groupId: 'group-apt-1',
    fromUserId: 'u-vikram',
    fromUserName: 'Vikram Reddy',
    toUserId: 'u-current',
    toUserName: 'You',
    amount: 140.0,
    status: 'SETTLED',
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'settle-2',
    groupId: 'group-trip-1',
    fromUserId: 'u-current',
    fromUserName: 'You',
    toUserId: 'u-sneha',
    toUserName: 'Sneha Murthy',
    amount: 22.5,
    status: 'SETTLED',
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'settle-3',
    groupId: 'group-apt-1',
    fromUserId: 'u-karthik',
    fromUserName: 'Karthik Varma',
    toUserId: 'u-current',
    toUserName: 'You',
    amount: 75.0,
    status: 'SETTLED',
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export function SettlementsScreen() {
  const router = useRouter();
  const [settlements] = useState<Settlement[]>(SAMPLE_SETTLEMENTS);

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
                  <Text style={styles.statusText}>Settled</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(s.settledAt).toLocaleDateString([], {
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
                    <Text style={{ fontWeight: '700' }}>{s.fromUserName}</Text> paid{' '}
                    <Text style={{ fontWeight: '700' }}>{s.toUserName}</Text>
                  </Text>
                  <Text style={styles.subtext}>Zelle / Direct Settlement • Verified</Text>
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
