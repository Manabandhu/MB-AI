import { formatDate, formatMoney } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  type ExpenseGroupType,
  listBalances,
  listExpenseGroups,
  listSettlements,
  memberLabel,
} from '@/modules/expenses/api';
import {
  netByCurrency,
  settlementStatus,
  sumByCurrency,
} from '@/modules/expenses/utils/expenseMath';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

// Every number on this screen is derived from the signed-in user's groups, balances, and settlements as returned by
// the backend. Amounts in different currencies are never added together.

type ExpensesScreenProps = {
  /** Kept for the route entry; the home screen is the only mode. */
  screenId?: 'home';
};

type Tab = 'groups' | 'balances' | 'activity';

const RECENT_ACTIVITY_LIMIT = 10;

const GROUP_STYLE: Record<ExpenseGroupType, { icon: AppIconName; label: string }> = {
  APARTMENT: { icon: 'home', label: 'Apartment' },
  TRIP: { icon: 'map', label: 'Trip' },
  CARPOOL: { icon: 'car', label: 'Carpool' },
  EVENT: { icon: 'community', label: 'Event' },
};

/** "$12.00 · ₹500.00", or a zero in `fallbackCurrency` when there is nothing. */
function formatTotals(totals: Map<string, number>, fallbackCurrency: string) {
  const entries = [...totals.entries()].filter(([, amount]) => Math.abs(amount) >= 0.005);
  if (entries.length === 0) return formatMoney(0, fallbackCurrency, { absolute: true });
  return entries
    .map(([currency, amount]) => formatMoney(amount, currency, { absolute: true }))
    .join(' · ');
}

export function ExpensesScreen(_props: ExpensesScreenProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [tab, setTab] = useState<Tab>('groups');

  const groupsQuery = useQuery({ queryKey: ['expenses', 'groups'], queryFn: listExpenseGroups });
  const balancesQuery = useQuery({ queryKey: ['expenses', 'balances'], queryFn: listBalances });
  const settlementsQuery = useQuery({
    queryKey: ['expenses', 'settlements'],
    queryFn: listSettlements,
  });
  const refetchAll = () => {
    groupsQuery.refetch();
    balancesQuery.refetch();
    settlementsQuery.refetch();
  };
  const refreshing =
    groupsQuery.isRefetching || balancesQuery.isRefetching || settlementsQuery.isRefetching;

  const header = (
    <ScreenHeader
      back={{ fallback: '/' as Href }}
      primaryAction={{ label: 'Add expense', icon: 'plus', route: '/expenses/add' as Href }}
      subtitle="Split rent, bills, trips, and carpools."
      title="Shared expenses"
    />
  );

  if (groupsQuery.isLoading || balancesQuery.isLoading || settlementsQuery.isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading your expenses…" />
      </Screen>
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
      <Screen onRefresh={refetchAll} refreshing={refreshing}>
        {header}
        <ErrorState
          body="There was a problem loading your groups and balances."
          onRetry={refetchAll}
          retryLabel="Retry"
          title="Unable to load expenses"
        />
      </Screen>
    );
  }

  const groups = groupsQuery.data;
  const balances = balancesQuery.data;
  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const fallbackCurrency = groups[0]?.currency ?? 'USD';
  const name = (userId: string) => memberLabel(userId, currentUserId);

  const owedToYou = balances.filter((b) => b.toUserId === currentUserId);
  const youOwe = balances.filter((b) => b.fromUserId === currentUserId);
  const net = netByCurrency(balances, currentUserId);
  const recentSettlements = [...settlementsQuery.data]
    .sort((a, b) => Date.parse(b.settledAt ?? b.createdAt) - Date.parse(a.settledAt ?? a.createdAt))
    .slice(0, RECENT_ACTIVITY_LIMIT);

  if (groups.length === 0) {
    return (
      <Screen onRefresh={refetchAll} refreshing={refreshing}>
        {header}
        <EmptyState
          actionLabel="Create a group"
          body="Create a group for your flat, trip, or carpool, then add bills to see who owes whom."
          iconName="wallet"
          onAction={() => router.push('/expenses/groups' as Href)}
          title="No expense groups yet"
        />
      </Screen>
    );
  }

  const groupNet = (groupId: string) =>
    netByCurrency(
      balances.filter((b) => b.groupId === groupId),
      currentUserId,
    );

  return (
    <Screen onRefresh={refetchAll} refreshing={refreshing}>
      {header}

      <Card gap="$x3" variant="tinted">
        <AppText tone="muted" variant="overline">
          Your balance
        </AppText>
        {net.size === 0 ? (
          <AppText variant="h3">All settled up</AppText>
        ) : (
          <YStack gap="$x1">
            {[...net.entries()].map(([currency, amount]) => (
              <AppText key={currency} tone={amount > 0 ? 'success' : 'warm'} variant="h3">
                {amount > 0 ? 'You are owed ' : 'You owe '}
                {formatMoney(amount, currency, { absolute: true })}
              </AppText>
            ))}
          </YStack>
        )}
        <XStack flexWrap="wrap" gap="$x4">
          <YStack gap={2}>
            <AppText tone="muted" variant="caption">
              Owed to you
            </AppText>
            <AppText variant="bodyStrong">
              {formatTotals(sumByCurrency(owedToYou), fallbackCurrency)}
            </AppText>
          </YStack>
          <YStack gap={2}>
            <AppText tone="muted" variant="caption">
              You owe
            </AppText>
            <AppText variant="bodyStrong">
              {formatTotals(sumByCurrency(youOwe), fallbackCurrency)}
            </AppText>
          </YStack>
        </XStack>
      </Card>

      <SegmentedControl
        label="Expenses view"
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: 'groups', label: 'Groups', count: groups.length },
          { value: 'balances', label: 'Balances', count: balances.length },
          { value: 'activity', label: 'Settlements', count: recentSettlements.length },
        ]}
        value={tab}
      />

      {tab === 'groups' ? (
        <YStack gap="$x3">
          {groups.map((group) => {
            const style = GROUP_STYLE[group.groupType] ?? GROUP_STYLE.APARTMENT;
            const groupBalance = [...groupNet(group.id).entries()];
            return (
              <Card
                aria-label={`Open ${group.name}`}
                href={`/expenses/groups/${group.id}` as Href}
                key={group.id}
              >
                <XStack alignItems="center" gap="$x3">
                  <AppIcon name={style.icon} size={22} />
                  <YStack flex={1} gap={2} minWidth={0}>
                    <AppText variant="bodyStrong">{group.name}</AppText>
                    <AppText tone="muted" variant="caption">
                      {style.label} · {group.memberCount}{' '}
                      {group.memberCount === 1 ? 'member' : 'members'} ·{' '}
                      {formatMoney(group.totalExpenses, group.currency)} spent
                    </AppText>
                  </YStack>
                  <AppIcon name="chevron-right" size={18} />
                </XStack>
                {groupBalance.length === 0 ? (
                  <StatusBadge
                    label={group.totalExpenses > 0 ? 'Settled' : 'No bills yet'}
                    tone={group.totalExpenses > 0 ? 'success' : 'neutral'}
                  />
                ) : (
                  groupBalance.map(([currency, amount]) => (
                    <StatusBadge
                      key={currency}
                      label={`${amount > 0 ? 'You are owed' : 'You owe'} ${formatMoney(amount, currency, { absolute: true })}`}
                      tone={amount > 0 ? 'success' : 'warning'}
                    />
                  ))
                )}
              </Card>
            );
          })}
          <AppButton label="Manage groups" route="/expenses/groups" variant="secondary" />
        </YStack>
      ) : null}

      {tab === 'balances' ? (
        balances.length === 0 ? (
          <EmptyState
            actionLabel="Add expense"
            body="You don't owe anyone and no one owes you right now."
            iconName="check"
            onAction={() => router.push('/expenses/add' as Href)}
            title="All settled up"
          />
        ) : (
          <YStack gap="$x3">
            {balances.map((b) => {
              const owedToMe = b.toUserId === currentUserId;
              const other = owedToMe ? b.fromUserId : b.toUserId;
              return (
                <Card key={`${b.groupId}-${b.fromUserId}-${b.toUserId}`}>
                  <XStack alignItems="center" gap="$x3">
                    <YStack flex={1} gap={2}>
                      <AppText variant="bodyStrong">
                        {owedToMe ? `${name(other)} owes you` : `You owe ${name(other)}`}
                      </AppText>
                      <AppText tone="muted" variant="caption">
                        {b.groupName}
                      </AppText>
                    </YStack>
                    <AppText tone={owedToMe ? 'success' : 'warm'} variant="bodyStrong">
                      {formatMoney(b.amount, b.currency, { absolute: true })}
                    </AppText>
                  </XStack>
                </Card>
              );
            })}
            <AppButton icon="wallet" label="Settle up" route="/expenses/balances" />
          </YStack>
        )
      ) : null}

      {tab === 'activity' ? (
        recentSettlements.length === 0 ? (
          <EmptyState
            actionLabel="View balances"
            body="Payments you record between group members will appear here."
            iconName="clock"
            onAction={() => router.push('/expenses/balances' as Href)}
            title="No settlements yet"
          />
        ) : (
          <YStack gap="$x3">
            {recentSettlements.map((s) => {
              const status = settlementStatus(s.status);
              return (
                <Card key={s.id}>
                  <StatusBadge label={status.label} tone={status.tone} />
                  <AppText variant="bodyStrong">
                    {name(s.fromUserId)} paid {name(s.toUserId)}{' '}
                    {formatMoney(s.amount, s.currency, { absolute: true })}
                  </AppText>
                  <AppText tone="muted" variant="caption">
                    {groupsById.get(s.groupId)?.name ?? 'Expense group'} ·{' '}
                    {formatDate(s.settledAt ?? s.createdAt, 'short')}
                  </AppText>
                </Card>
              );
            })}
            <AppButton label="All settlements" route="/expenses/settlements" variant="secondary" />
          </YStack>
        )
      ) : null}
    </Screen>
  );
}
