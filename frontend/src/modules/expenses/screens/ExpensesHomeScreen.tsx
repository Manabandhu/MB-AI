import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExpensesScreen } from '@/modules/expenses/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

type ExpensesScreenProps = {
  screenId: keyof typeof expenseRoutes;
};

type TabType = 'groups' | 'balances' | 'activity';

export function ExpensesScreen({ screenId }: ExpensesScreenProps) {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ name: string; amount: string; note: string } | null>(null);

  const screen = useQuery({
    queryKey: ['expenses', 'screen', screenId],
    queryFn: () => getExpensesScreen(screenId),
    retry: false,
  });

  if (screen.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  // If screenId is not 'home', use FeatureScreen for sub-pages
  if (screenId !== 'home') {
    const data = screen.data ?? DEFAULT_EXPENSES_DATA[screenId] ?? DEFAULT_EXPENSES_DATA.home;
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

  const handleOpenSettle = (person: { name: string; amount: string; note: string }) => {
    setSelectedPerson(person);
    setSettleModalVisible(true);
  };

  const handleConfirmZelle = () => {
    Alert.alert('Zelle Settlement', `Payment of ${selectedPerson?.amount ?? '$45.00'} marked as settled.`);
    setSettleModalVisible(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={[s.container, { maxWidth: layout.maxContentWidth }]}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <View style={s.badgePill}>
                <Text style={s.badgePillText}>SHARED EXPENSES & SPLITS</Text>
              </View>
              <Text style={s.headerTitle}>Flatmate & Trip Splits</Text>
              <Text style={s.headerSubtitle}>
                Zero-math, transparent cost splitting with direct Zelle settlements.
              </Text>
            </View>
            <Pressable
              style={s.addBtn}
              onPress={() => router.push('/expenses/add')}
              accessibilityRole="button"
              accessibilityLabel="Add new expense"
            >
              <AppIcon name="plus" size={18} color="#fff" />
              <Text style={s.addBtnText}>Add Bill</Text>
            </Pressable>
          </View>

          {/* Hero Net Balance Card */}
          <View style={s.heroCard}>
            <View style={s.heroTop}>
              <Text style={s.heroLabel}>TOTAL NET BALANCE</Text>
              <View style={s.heroStatusTag}>
                <Text style={s.heroStatusText}>Active across 4 groups</Text>
              </View>
            </View>

            <View style={s.heroAmountRow}>
              <Text style={s.heroSign}>+</Text>
              <Text style={s.heroAmount}>$75.00</Text>
              <Text style={s.heroNetLabel}>Net Owed to You</Text>
            </View>

            {/* Split breakdown row */}
            <View style={s.breakdownRow}>
              <View style={s.breakdownCardGreen}>
                <View style={s.breakdownHeader}>
                  <AppIcon name="check" size={14} color="#15803d" />
                  <Text style={s.breakdownTitleGreen}>You are owed</Text>
                </View>
                <Text style={s.breakdownAmountGreen}>$120.00</Text>
                <Text style={s.breakdownSub}>Patel Brothers groceries & carpool</Text>
              </View>

              <View style={s.breakdownCardOrange}>
                <View style={s.breakdownHeader}>
                  <AppIcon name="wallet" size={14} color="#b45309" />
                  <Text style={s.breakdownTitleOrange}>You owe</Text>
                </View>
                <Text style={s.breakdownAmountOrange}>$45.00</Text>
                <Text style={s.breakdownSub}>Gas on I-35 to Priya M.</Text>
              </View>
            </View>

            {/* Quick Hero Actions */}
            <View style={s.heroActionsRow}>
              <Pressable
                style={s.heroActionPrimary}
                onPress={() => router.push('/expenses/add')}
              >
                <AppIcon name="plus" size={16} color="#431ebe" />
                <Text style={s.heroActionPrimaryText}>Add Expense</Text>
              </Pressable>

              <Pressable
                style={s.heroActionSecondary}
                onPress={() => handleOpenSettle({ name: 'Priya M.', amount: '$45.00', note: 'I-35 Carpool Fuel' })}
              >
                <AppIcon name="wallet" size={16} color="#fff" />
                <Text style={s.heroActionSecondaryText}>Settle via Zelle</Text>
              </Pressable>
            </View>
          </View>

          {/* Segmented Filter Tabs */}
          <View style={s.tabBar}>
            <Pressable
              style={[s.tabItem, activeTab === 'groups' && s.tabItemActive]}
              onPress={() => setActiveTab('groups')}
            >
              <Text style={[s.tabText, activeTab === 'groups' && s.tabTextActive]}>Active Groups (4)</Text>
            </Pressable>
            <Pressable
              style={[s.tabItem, activeTab === 'balances' && s.tabItemActive]}
              onPress={() => setActiveTab('balances')}
            >
              <Text style={[s.tabText, activeTab === 'balances' && s.tabTextActive]}>Who Owes Whom</Text>
            </Pressable>
            <Pressable
              style={[s.tabItem, activeTab === 'activity' && s.tabItemActive]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[s.tabText, activeTab === 'activity' && s.tabTextActive]}>Recent Activity</Text>
            </Pressable>
          </View>

          {/* Tab 1: Active Groups */}
          {activeTab === 'groups' && (
            <View style={s.groupsList}>
              {/* Group 1 */}
              <View style={s.groupCard}>
                <View style={s.groupHeader}>
                  <View style={s.groupIconWrap}>
                    <AppIcon name="home" size={20} color="#431ebe" />
                  </View>
                  <View style={s.groupInfo}>
                    <Text style={s.groupTitle}>Domain 2B2B Flatmates</Text>
                    <Text style={s.groupMeta}>Austin, TX • 4 flatmates • Monthly utilities</Text>
                  </View>
                  <View style={s.groupBadgeOwed}>
                    <Text style={s.groupBadgeOwedText}>+$35.00</Text>
                  </View>
                </View>

                <View style={s.groupDetailsBox}>
                  <Text style={s.groupDetailsText}>
                    📦 Latest: Patel Brothers Groceries ($164.20) • Paid by You
                  </Text>
                  <Text style={s.groupTagsText}>⚡ Water, Gas, Spectrum 1Gbps Internet</Text>
                </View>

                <View style={s.groupFooter}>
                  <Pressable style={s.groupActionBtn} onPress={() => router.push('/expenses/groups')}>
                    <Text style={s.groupActionBtnText}>View Group Bills</Text>
                  </Pressable>
                  <Pressable
                    style={s.groupSettleBtn}
                    onPress={() => handleOpenSettle({ name: 'Ravi Teja', amount: '$35.00', note: 'Grocery split' })}
                  >
                    <Text style={s.groupSettleBtnText}>Request Zelle</Text>
                  </Pressable>
                </View>
              </View>

              {/* Group 2 */}
              <View style={s.groupCard}>
                <View style={s.groupHeader}>
                  <View style={[s.groupIconWrap, { backgroundColor: '#e6f4f4' }]}>
                    <AppIcon name="car" size={20} color="#00696b" />
                  </View>
                  <View style={s.groupInfo}>
                    <Text style={s.groupTitle}>Dallas Diwali Roadtrip</Text>
                    <Text style={s.groupMeta}>Austin ⇄ Dallas • 3 members • Carpool</Text>
                  </View>
                  <View style={s.groupBadgeSettled}>
                    <Text style={s.groupBadgeSettledText}>All Settled ✓</Text>
                  </View>
                </View>

                <View style={s.groupDetailsBox}>
                  <Text style={s.groupDetailsText}>
                    🛣️ TxTag Tolls ($18.40) & Buc-ee's Snacks ($32.10)
                  </Text>
                  <Text style={s.groupTagsText}>Zero balance • All members cleared via Zelle</Text>
                </View>

                <View style={s.groupFooter}>
                  <Pressable style={s.groupActionBtn} onPress={() => router.push('/expenses/groups')}>
                    <Text style={s.groupActionBtnText}>View Receipts</Text>
                  </Pressable>
                </View>
              </View>

              {/* Group 3 */}
              <View style={s.groupCard}>
                <View style={s.groupHeader}>
                  <View style={[s.groupIconWrap, { backgroundColor: '#fff7ed' }]}>
                    <AppIcon name="community" size={20} color="#ff7e33" />
                  </View>
                  <View style={s.groupInfo}>
                    <Text style={s.groupTitle}>Sunday Cricket Turf & Chai</Text>
                    <Text style={s.groupMeta}>Round Rock Sports Complex • 6 players</Text>
                  </View>
                  <View style={s.groupBadgeOwe}>
                    <Text style={s.groupBadgeOweText}>You owe $15.00</Text>
                  </View>
                </View>

                <View style={s.groupDetailsBox}>
                  <Text style={s.groupDetailsText}>
                    🏏 Turf 2-Hour Booking & Irani Chai / Samosas ($90.00)
                  </Text>
                  <Text style={s.groupTagsText}>Paid by Rajesh K. • 4 of 6 paid</Text>
                </View>

                <View style={s.groupFooter}>
                  <Pressable style={s.groupActionBtn} onPress={() => router.push('/expenses/groups')}>
                    <Text style={s.groupActionBtnText}>Details</Text>
                  </Pressable>
                  <Pressable
                    style={[s.groupSettleBtn, { backgroundColor: '#ff7e33' }]}
                    onPress={() => handleOpenSettle({ name: 'Rajesh K.', amount: '$15.00', note: 'Cricket turf & samosa split' })}
                  >
                    <Text style={s.groupSettleBtnText}>Pay $15 via Zelle</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Who Owes Whom */}
          {activeTab === 'balances' && (
            <View style={s.groupsList}>
              <View style={s.balanceItemCard}>
                <View style={s.balanceAvatar}>
                  <Text style={s.balanceAvatarText}>RT</Text>
                </View>
                <View style={s.balanceDetails}>
                  <Text style={s.balanceName}>Ravi Teja</Text>
                  <Text style={s.balanceReason}>Domain 2B2B Grocery Split</Text>
                </View>
                <View style={s.balanceRightCol}>
                  <Text style={s.balanceOwedGreen}>+$75.00</Text>
                  <Pressable
                    style={s.balanceRemindBtn}
                    onPress={() => Alert.alert('Reminded', 'Zelle reminder sent to Ravi Teja.')}
                  >
                    <Text style={s.balanceRemindText}>Send Reminder</Text>
                  </Pressable>
                </View>
              </View>

              <View style={s.balanceItemCard}>
                <View style={[s.balanceAvatar, { backgroundColor: '#fff7ed', borderColor: '#ff7e33' }]}>
                  <Text style={[s.balanceAvatarText, { color: '#ff7e33' }]}>PM</Text>
                </View>
                <View style={s.balanceDetails}>
                  <Text style={s.balanceName}>Priya M.</Text>
                  <Text style={s.balanceReason}>I-35 Gas & Tolls</Text>
                </View>
                <View style={s.balanceRightCol}>
                  <Text style={s.balanceOweOrange}>You owe $45.00</Text>
                  <Pressable
                    style={s.balancePayBtn}
                    onPress={() => handleOpenSettle({ name: 'Priya M.', amount: '$45.00', note: 'I-35 Carpool Fuel' })}
                  >
                    <Text style={s.balancePayText}>Pay via Zelle</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Tab 3: Recent Activity */}
          {activeTab === 'activity' && (
            <View style={s.groupsList}>
              <View style={s.activityRow}>
                <View style={s.activityDot} />
                <View style={s.activityBody}>
                  <Text style={s.activityTitle}>Karthik V. added Spectrum 1Gbps WiFi bill ($70.00)</Text>
                  <Text style={s.activityMeta}>Domain 2B2B Flatmates • 2 hours ago</Text>
                </View>
              </View>
              <View style={s.activityRow}>
                <View style={[s.activityDot, { backgroundColor: '#10b981' }]} />
                <View style={s.activityBody}>
                  <Text style={s.activityTitle}>Priya M. settled $45.00 via Zelle</Text>
                  <Text style={s.activityMeta}>Dallas Diwali Roadtrip • Yesterday at 6:42 PM</Text>
                </View>
              </View>
              <View style={s.activityRow}>
                <View style={s.activityDot} />
                <View style={s.activityBody}>
                  <Text style={s.activityTitle}>Suresh R. recorded Patel Brothers Grocery ($164.20)</Text>
                  <Text style={s.activityMeta}>Domain 2B2B Flatmates • 3 days ago</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Footer Links */}
          <View style={s.footerNav}>
            <AppButton label="View All Expense Groups" route="/expenses/groups" variant="secondary" />
          </View>
        </View>
      </ScrollView>

      {/* Settle via Zelle Modal */}
      <Modal visible={settleModalVisible} transparent animationType="slide">
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Settle Up via Zelle</Text>
              <Pressable onPress={() => setSettleModalVisible(false)}>
                <AppIcon name="logout" size={20} color="#625f6e" />
              </Pressable>
            </View>

            <View style={s.modalRecipientBox}>
              <Text style={s.modalRecipientLabel}>PAYING TO</Text>
              <Text style={s.modalRecipientName}>{selectedPerson?.name ?? 'Community Member'}</Text>
              <Text style={s.modalRecipientSub}>{selectedPerson?.note ?? 'Shared Expense'}</Text>
              <Text style={s.modalAmount}>{selectedPerson?.amount ?? '$45.00'}</Text>
            </View>

            <View style={s.zelleTipsBox}>
              <Text style={s.zelleTipHeader}>✓ Direct Bank Transfer Instructions</Text>
              <Text style={s.zelleTipText}>
                Open your bank app (Chase, BoA, Wells Fargo) and transfer directly to the member's verified community phone/email.
              </Text>
            </View>

            <Pressable style={s.modalConfirmBtn} onPress={handleConfirmZelle}>
              <Text style={s.modalConfirmText}>I Have Sent This via Zelle ✓</Text>
            </Pressable>

            <Pressable style={s.modalCancelBtn} onPress={() => setSettleModalVisible(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const DEFAULT_EXPENSES_DATA: Record<string, CatalogScreenContent> = {
  home: {
    title: 'Split expenses with trust',
    subtitle: 'Track shared expenses, balances, and settlements across groups and trips.',
    eyebrow: 'Expenses',
    metrics: [
      { label: 'Active groups', value: '4' },
      { label: 'Outstanding', value: '$186.50' },
    ],
    items: [
      { id: 'groups', title: 'Your groups', body: 'Open groups you belong to with live balances.', meta: 'Groups', route: '/expenses/groups' },
      { id: 'balances', title: 'Who owes whom', body: 'See net balances and settlement suggestions.', meta: 'Balances', route: '/expenses/balances' },
    ],
  },
  groups: {
    title: 'Your expense groups',
    subtitle: 'Flatmates, road trips, and shared groceries in Austin.',
    eyebrow: 'Expense Groups',
    metrics: [
      { label: 'Total groups', value: '3' },
      { label: 'Settled', value: '12' },
    ],
    items: [
      { id: 'apt-402', title: 'Apt 402 Utilities', body: 'Austin TX · 4 flatmates · Water, Gas & Internet', meta: 'Monthly', route: '/expenses/groups' },
      { id: 'dallas-trip', title: 'Dallas Diwali Roadtrip', body: 'Carpool & Gas split · 3 members', meta: 'Recent', route: '/expenses/groups' },
    ],
  },
  balances: {
    title: 'Balances & Settlements',
    subtitle: 'Track who owes whom with automatic net-settlement calculation.',
    eyebrow: 'Net Balances',
    metrics: [
      { label: 'You owe', value: '$45.00' },
      { label: 'You are owed', value: '$120.00' },
    ],
    items: [
      { id: 'b1', title: 'Ravi Teja owes you $75.00', body: 'Groceries at Patel Brothers', meta: 'Pending', route: '/expenses/settlements' },
      { id: 'b2', title: 'You owe Priya $45.00', body: 'Gas on I-35 carpool', meta: 'Due', route: '/expenses/settlements' },
    ],
  },
  settlements: {
    title: 'Past Settlements',
    subtitle: 'History of completed transfers via Zelle and Venmo.',
    eyebrow: 'Settlements',
    metrics: [
      { label: 'Total settled', value: '$1,420' },
      { label: 'This month', value: '$240' },
    ],
    items: [
      { id: 's1', title: 'Settled $120.00 with Suresh', body: 'Paid via Zelle · Oct 2', meta: 'Completed', route: '/expenses/balances' },
    ],
  },
  add: {
    title: 'Add New Expense',
    subtitle: 'Record a receipt, split by percentages or equal shares.',
    eyebrow: 'New Expense',
    metrics: [],
    items: [
      { id: 'quick-split', title: 'Equal Split', body: 'Divide total equally among group members.', meta: 'Standard', route: '/expenses/groups' },
    ],
  },
};

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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf8ff' },
  scrollContent: { padding: space.x4, flexGrow: 1 },
  container: { width: '100%', alignSelf: 'center', gap: space.x4 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, gap: 4 },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#431ebe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#625f6e',
    lineHeight: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#431ebe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  heroCard: {
    backgroundColor: '#431ebe',
    borderRadius: 20,
    padding: space.x4,
    gap: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroStatusTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  heroStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroSign: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '800',
  },
  heroAmount: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroNetLabel: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },

  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakdownCardGreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownTitleGreen: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownAmountGreen: {
    color: '#15803d',
    fontSize: 18,
    fontWeight: '900',
  },
  breakdownCardOrange: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 2,
  },
  breakdownTitleOrange: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownAmountOrange: {
    color: '#b45309',
    fontSize: 18,
    fontWeight: '900',
  },
  breakdownSub: {
    color: '#625f6e',
    fontSize: 10,
    marginTop: 2,
  },

  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  heroActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroActionPrimaryText: {
    color: '#431ebe',
    fontSize: 13,
    fontWeight: '800',
  },
  heroActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroActionSecondaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f9',
    padding: 4,
    borderRadius: radius.pill,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#625f6e',
  },
  tabTextActive: {
    color: '#431ebe',
    fontWeight: '800',
  },

  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: 12,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#131b2e',
  },
  groupMeta: {
    fontSize: 11,
    color: '#625f6e',
    marginTop: 2,
  },
  groupBadgeOwed: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  groupBadgeOwedText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '800',
  },
  groupBadgeSettled: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  groupBadgeSettledText: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '700',
  },
  groupBadgeOwe: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  groupBadgeOweText: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '800',
  },

  groupDetailsBox: {
    backgroundColor: '#faf8ff',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  groupDetailsText: {
    fontSize: 12,
    color: '#131b2e',
    fontWeight: '600',
  },
  groupTagsText: {
    fontSize: 11,
    color: '#625f6e',
  },

  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  groupActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  groupActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#625f6e',
  },
  groupSettleBtn: {
    backgroundColor: '#431ebe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  groupSettleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  balanceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: 12,
  },
  balanceAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e6e8ff',
    borderWidth: 1.5,
    borderColor: '#431ebe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAvatarText: {
    color: '#431ebe',
    fontSize: 14,
    fontWeight: '800',
  },
  balanceDetails: {
    flex: 1,
  },
  balanceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#131b2e',
  },
  balanceReason: {
    fontSize: 12,
    color: '#625f6e',
    marginTop: 2,
  },
  balanceRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  balanceOwedGreen: {
    color: '#15803d',
    fontSize: 15,
    fontWeight: '800',
  },
  balanceRemindBtn: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  balanceRemindText: {
    color: '#431ebe',
    fontSize: 11,
    fontWeight: '700',
  },
  balanceOweOrange: {
    color: '#c2410c',
    fontSize: 14,
    fontWeight: '800',
  },
  balancePayBtn: {
    backgroundColor: '#ff7e33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  balancePayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#431ebe',
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131b2e',
  },
  activityMeta: {
    fontSize: 11,
    color: '#625f6e',
    marginTop: 2,
  },

  footerNav: {
    paddingTop: space.x2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.x4,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131b2e',
  },
  modalRecipientBox: {
    backgroundColor: '#faf8ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  modalRecipientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#625f6e',
    letterSpacing: 0.5,
  },
  modalRecipientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#431ebe',
  },
  modalRecipientSub: {
    fontSize: 12,
    color: '#625f6e',
  },
  modalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#131b2e',
    marginTop: 6,
  },
  zelleTipsBox: {
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  zelleTipHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00696b',
  },
  zelleTipText: {
    fontSize: 11,
    color: '#00696b',
    lineHeight: 16,
  },
  modalConfirmBtn: {
    backgroundColor: '#431ebe',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalCancelText: {
    color: '#625f6e',
    fontSize: 13,
    fontWeight: '600',
  },
});
