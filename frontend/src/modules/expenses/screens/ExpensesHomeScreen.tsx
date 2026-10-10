import { formatMoney } from '@manabandhu/core';
import { radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import {
  type DebtBalance,
  type ExpenseGroup,
  type ExpenseGroupType,
  listBalances,
  listExpenseGroups,
  listSettlements,
  memberLabel,
  type Settlement,
} from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

// Every number on this screen is derived from the signed-in user's groups, balances, and settlements as returned by
// the backend. There is no sample or fallback data: no groups shows an empty state, a failed request shows an error.

type ExpensesScreenProps = {
  /** Kept for the route entry; the home screen is the only mode. */
  screenId?: 'home';
};

type TabType = 'groups' | 'balances' | 'activity';

const RECENT_ACTIVITY_LIMIT = 10;

const GROUP_STYLE: Record<
  ExpenseGroupType,
  { icon: AppIconName; bg: string; fg: string; label: string }
> = {
  APARTMENT: { icon: 'home', bg: '#e6e8ff', fg: '#431ebe', label: 'Apartment' },
  TRIP: { icon: 'map', bg: '#e6f4f4', fg: '#00696b', label: 'Trip' },
  CARPOOL: { icon: 'car', bg: '#e6f4f4', fg: '#00696b', label: 'Carpool' },
  EVENT: { icon: 'community', bg: '#fff7ed', fg: '#ff7e33', label: 'Event' },
};

const SETTLEMENT_STATUS: Record<Settlement['status'], string> = {
  completed: 'Settled',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

/** Signed sums keyed by currency; amounts in different currencies are never added together. */
function sumByCurrency(rows: { amount: number; currency: string }[], sign = 1) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + sign * row.amount);
  }
  return totals;
}

function formatTotals(totals: Map<string, number>, fallbackCurrency: string, signed = false) {
  const entries = [...totals.entries()].filter(([, amount]) => Math.abs(amount) >= 0.005);
  if (entries.length === 0) return formatMoney(0, fallbackCurrency, { absolute: true });
  return entries
    .map(
      ([currency, amount]) =>
        `${signed ? (amount > 0 ? '+' : '−') : ''}${formatMoney(amount, currency, { absolute: true })}`,
    )
    .join(' · ');
}

function uniqueGroupNames(rows: DebtBalance[]) {
  return [...new Set(rows.map((b) => b.groupName))].join(', ');
}

export function ExpensesScreen(_props: ExpensesScreenProps) {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeTab, setActiveTab] = useState<TabType>('groups');

  const groupsQuery = useQuery({ queryKey: ['expenses', 'groups'], queryFn: listExpenseGroups });
  const balancesQuery = useQuery({ queryKey: ['expenses', 'balances'], queryFn: listBalances });
  const settlementsQuery = useQuery({
    queryKey: ['expenses', 'settlements'],
    queryFn: listSettlements,
  });

  if (groupsQuery.isLoading || balancesQuery.isLoading || settlementsQuery.isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading your expenses..." />
      </ScreenShell>
    );
  }

  if (
    groupsQuery.error ||
    balancesQuery.error ||
    settlementsQuery.error ||
    !groupsQuery.data ||
    !balancesQuery.data ||
    !settlementsQuery.data
  ) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load expenses"
          body="There was a problem loading your groups and balances."
          retryLabel="Retry"
          onRetry={() => {
            groupsQuery.refetch();
            balancesQuery.refetch();
            settlementsQuery.refetch();
          }}
        />
      </ScreenShell>
    );
  }

  const groups = groupsQuery.data;
  const balances = balancesQuery.data;
  const groupsById = new Map<string, ExpenseGroup>(groups.map((g) => [g.id, g]));
  const fallbackCurrency = groups[0]?.currency ?? 'USD';
  const name = (userId: string) => memberLabel(userId, currentUserId);

  const owedToYou = balances.filter((b) => b.toUserId === currentUserId);
  const youOwe = balances.filter((b) => b.fromUserId === currentUserId);
  const net = sumByCurrency(owedToYou);
  for (const [currency, amount] of sumByCurrency(youOwe, -1)) {
    net.set(currency, (net.get(currency) ?? 0) + amount);
  }
  const netEntries = [...net.entries()].filter(([, amount]) => Math.abs(amount) >= 0.005);
  const singleNet = netEntries.length === 1 ? netEntries[0][1] : null;
  const netLabel =
    netEntries.length === 0
      ? 'All settled up'
      : singleNet === null
        ? 'Net across currencies'
        : singleNet > 0
          ? 'Net owed to you'
          : 'Net you owe';

  const groupNet = (groupId: string) =>
    balances.reduce((sum, b) => {
      if (b.groupId !== groupId) return sum;
      if (b.toUserId === currentUserId) return sum + b.amount;
      if (b.fromUserId === currentUserId) return sum - b.amount;
      return sum;
    }, 0);

  const recentSettlements = [...settlementsQuery.data]
    .sort(
      (a, b) =>
        new Date(b.settledAt ?? b.createdAt).getTime() -
        new Date(a.settledAt ?? a.createdAt).getTime(),
    )
    .slice(0, RECENT_ACTIVITY_LIMIT);

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
                Transparent cost splitting for flatmates, trips, and carpools.
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

          {groups.length === 0 ? (
            <EmptyState
              title="No expense groups yet"
              body="Create a group for your flat, trip, or carpool, then add bills to see who owes whom."
              actionLabel="Create group"
              onAction={() => router.push('/expenses/groups')}
            />
          ) : (
            <>
              {/* Hero Net Balance Card */}
              <View style={s.heroCard}>
                <View style={s.heroTop}>
                  <Text style={s.heroLabel}>TOTAL NET BALANCE</Text>
                  <View style={s.heroStatusTag}>
                    <Text style={s.heroStatusText}>
                      {groups.length} active {groups.length === 1 ? 'group' : 'groups'}
                    </Text>
                  </View>
                </View>

                <View style={s.heroAmountRow}>
                  {singleNet !== null && (
                    <Text style={[s.heroSign, singleNet < 0 && s.heroSignOwe]}>
                      {singleNet > 0 ? '+' : '−'}
                    </Text>
                  )}
                  <Text
                    style={
                      singleNet === null && netEntries.length > 1 ? s.heroAmountMulti : s.heroAmount
                    }
                  >
                    {formatTotals(net, fallbackCurrency, netEntries.length > 1)}
                  </Text>
                  <Text
                    style={[s.heroNetLabel, singleNet !== null && singleNet < 0 && s.heroSignOwe]}
                  >
                    {netLabel}
                  </Text>
                </View>

                {/* Split breakdown row */}
                <View style={s.breakdownRow}>
                  <View style={s.breakdownCardGreen}>
                    <View style={s.breakdownHeader}>
                      <AppIcon name="check" size={14} color="#15803d" />
                      <Text style={s.breakdownTitleGreen}>You are owed</Text>
                    </View>
                    <Text style={s.breakdownAmountGreen}>
                      {formatTotals(sumByCurrency(owedToYou), fallbackCurrency)}
                    </Text>
                    <Text numberOfLines={1} style={s.breakdownSub}>
                      {owedToYou.length > 0 ? uniqueGroupNames(owedToYou) : 'Nothing outstanding'}
                    </Text>
                  </View>

                  <View style={s.breakdownCardOrange}>
                    <View style={s.breakdownHeader}>
                      <AppIcon name="wallet" size={14} color="#b45309" />
                      <Text style={s.breakdownTitleOrange}>You owe</Text>
                    </View>
                    <Text style={s.breakdownAmountOrange}>
                      {formatTotals(sumByCurrency(youOwe), fallbackCurrency)}
                    </Text>
                    <Text numberOfLines={1} style={s.breakdownSub}>
                      {youOwe.length > 0 ? uniqueGroupNames(youOwe) : 'Nothing outstanding'}
                    </Text>
                  </View>
                </View>

                {/* Quick Hero Actions */}
                <View style={s.heroActionsRow}>
                  <Pressable
                    style={s.heroActionPrimary}
                    onPress={() => router.push('/expenses/add')}
                    accessibilityRole="button"
                  >
                    <AppIcon name="plus" size={16} color="#431ebe" />
                    <Text style={s.heroActionPrimaryText}>Add Expense</Text>
                  </Pressable>

                  {balances.length > 0 && (
                    <Pressable
                      style={s.heroActionSecondary}
                      onPress={() => router.push('/expenses/balances')}
                      accessibilityRole="button"
                    >
                      <AppIcon name="wallet" size={16} color="#fff" />
                      <Text style={s.heroActionSecondaryText}>Settle up</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Segmented Filter Tabs */}
              <View style={s.tabBar}>
                <Pressable
                  style={[s.tabItem, activeTab === 'groups' && s.tabItemActive]}
                  onPress={() => setActiveTab('groups')}
                >
                  <Text style={[s.tabText, activeTab === 'groups' && s.tabTextActive]}>
                    Active Groups ({groups.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.tabItem, activeTab === 'balances' && s.tabItemActive]}
                  onPress={() => setActiveTab('balances')}
                >
                  <Text style={[s.tabText, activeTab === 'balances' && s.tabTextActive]}>
                    Who Owes Whom
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.tabItem, activeTab === 'activity' && s.tabItemActive]}
                  onPress={() => setActiveTab('activity')}
                >
                  <Text style={[s.tabText, activeTab === 'activity' && s.tabTextActive]}>
                    Recent Activity
                  </Text>
                </Pressable>
              </View>

              {/* Tab 1: Active Groups */}
              {activeTab === 'groups' && (
                <View style={s.groupsList}>
                  {groups.map((group) => {
                    const style = GROUP_STYLE[group.groupType] ?? GROUP_STYLE.APARTMENT;
                    const netInGroup = groupNet(group.id);
                    return (
                      <View key={group.id} style={s.groupCard}>
                        <View style={s.groupHeader}>
                          <View style={[s.groupIconWrap, { backgroundColor: style.bg }]}>
                            <AppIcon name={style.icon} size={20} color={style.fg} />
                          </View>
                          <View style={s.groupInfo}>
                            <Text style={s.groupTitle}>{group.name}</Text>
                            <Text style={s.groupMeta}>
                              {style.label} • {group.memberCount}{' '}
                              {group.memberCount === 1 ? 'member' : 'members'}
                            </Text>
                          </View>
                          {netInGroup >= 0.005 ? (
                            <View style={s.groupBadgeOwed}>
                              <Text style={s.groupBadgeOwedText}>
                                +{formatMoney(netInGroup, group.currency, { absolute: true })}
                              </Text>
                            </View>
                          ) : netInGroup <= -0.005 ? (
                            <View style={s.groupBadgeOwe}>
                              <Text style={s.groupBadgeOweText}>
                                You owe{' '}
                                {formatMoney(netInGroup, group.currency, { absolute: true })}
                              </Text>
                            </View>
                          ) : (
                            <View style={s.groupBadgeSettled}>
                              <Text style={s.groupBadgeSettledText}>
                                {group.totalExpenses > 0 ? 'Settled ✓' : 'No bills yet'}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={s.groupDetailsBox}>
                          <Text style={s.groupDetailsText}>
                            Total spend:{' '}
                            {formatMoney(group.totalExpenses, group.currency, { absolute: true })}
                          </Text>
                          {group.description ? (
                            <Text style={s.groupTagsText}>{group.description}</Text>
                          ) : null}
                        </View>

                        <View style={s.groupFooter}>
                          <Pressable
                            style={s.groupActionBtn}
                            onPress={() => router.push(`/expenses/groups/${group.id}`)}
                            accessibilityRole="button"
                          >
                            <Text style={s.groupActionBtnText}>View group</Text>
                          </Pressable>
                          {netInGroup <= -0.005 && (
                            <Pressable
                              style={[s.groupSettleBtn, { backgroundColor: '#ff7e33' }]}
                              onPress={() => router.push('/expenses/balances')}
                              accessibilityRole="button"
                            >
                              <Text style={s.groupSettleBtnText}>Settle up</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Tab 2: Who Owes Whom */}
              {activeTab === 'balances' &&
                (balances.length === 0 ? (
                  <EmptyState
                    title="All settled up"
                    body="You don't owe anyone and no one owes you right now."
                    actionLabel="Add expense"
                    onAction={() => router.push('/expenses/add')}
                  />
                ) : (
                  <View style={s.groupsList}>
                    {balances.map((b) => {
                      const owedToMe = b.toUserId === currentUserId;
                      const other = owedToMe ? b.fromUserId : b.toUserId;
                      return (
                        <View
                          key={`${b.groupId}-${b.fromUserId}-${b.toUserId}`}
                          style={s.balanceItemCard}
                        >
                          <View
                            style={[
                              s.balanceAvatar,
                              !owedToMe && { backgroundColor: '#fff7ed', borderColor: '#ff7e33' },
                            ]}
                          >
                            <Text style={[s.balanceAvatarText, !owedToMe && { color: '#ff7e33' }]}>
                              {name(other).slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={s.balanceDetails}>
                            <Text style={s.balanceName}>{name(other)}</Text>
                            <Text style={s.balanceReason}>{b.groupName}</Text>
                          </View>
                          <View style={s.balanceRightCol}>
                            {owedToMe ? (
                              <Text style={s.balanceOwedGreen}>
                                +{formatMoney(b.amount, b.currency, { absolute: true })}
                              </Text>
                            ) : (
                              <>
                                <Text style={s.balanceOweOrange}>
                                  You owe {formatMoney(b.amount, b.currency, { absolute: true })}
                                </Text>
                                <Pressable
                                  style={s.balancePayBtn}
                                  onPress={() => router.push('/expenses/balances')}
                                  accessibilityRole="button"
                                >
                                  <Text style={s.balancePayText}>Settle up</Text>
                                </Pressable>
                              </>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

              {/* Tab 3: Recent Activity (recorded settlements) */}
              {activeTab === 'activity' &&
                (recentSettlements.length === 0 ? (
                  <EmptyState
                    title="No settlements yet"
                    body="Payments you record between group members will appear here."
                    actionLabel="View balances"
                    onAction={() => router.push('/expenses/balances')}
                  />
                ) : (
                  <View style={s.groupsList}>
                    {recentSettlements.map((settlement) => (
                      <View key={settlement.id} style={s.activityRow}>
                        <View
                          style={[
                            s.activityDot,
                            settlement.status === 'completed' && { backgroundColor: '#10b981' },
                          ]}
                        />
                        <View style={s.activityBody}>
                          <Text style={s.activityTitle}>
                            {name(settlement.fromUserId)} paid {name(settlement.toUserId)}{' '}
                            {formatMoney(settlement.amount, settlement.currency, {
                              absolute: true,
                            })}
                          </Text>
                          <Text style={s.activityMeta}>
                            {groupsById.get(settlement.groupId)?.name ?? 'Expense group'} •{' '}
                            {new Date(
                              settlement.settledAt ?? settlement.createdAt,
                            ).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            • {SETTLEMENT_STATUS[settlement.status] ?? settlement.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
            </>
          )}

          {/* Quick Footer Links */}
          <View style={s.footerNav}>
            <AppButton
              label="View All Expense Groups"
              route="/expenses/groups"
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 4,
  },
  heroSign: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSignOwe: {
    color: '#fdba74',
  },
  heroAmount: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroAmountMulti: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
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
});
