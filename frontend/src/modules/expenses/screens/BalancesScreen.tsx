import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  type DebtBalance,
  listBalances,
  memberLabel,
  recordSettlement,
} from '@/modules/expenses/api';
import { netByCurrency, sumByCurrency } from '@/modules/expenses/expenseMath';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { showError, showMessage } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

const balanceKey = (b: DebtBalance) => `${b.groupId}-${b.fromUserId}-${b.toUserId}`;

/** Who owes whom across your groups, per currency, with a confirmed "settle up" per balance. */
export function BalancesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const name = (userId: string) => memberLabel(userId, currentUserId);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
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
      const amount = formatMoney(b.amount, b.currency, { absolute: true });
      if (String(settlement.status).toLowerCase() === 'completed') {
        showMessage(
          'Settled up',
          `${amount} from ${name(b.fromUserId)} to ${name(b.toUserId)} is recorded.`,
        );
      } else {
        showMessage(
          'Waiting for confirmation',
          `${name(b.toUserId)} needs to confirm they received ${amount}. The balance updates once they do.`,
        );
      }
    },
    onError: (err) => showError('Unable to record the payment', err),
  });
  const settlingKey = settle.isPending && settle.variables ? balanceKey(settle.variables) : null;

  const askSettle = async (b: DebtBalance) => {
    const amount = formatMoney(b.amount, b.currency, { absolute: true });
    const iReceived = b.toUserId === currentUserId;
    const ok = await confirm(
      iReceived
        ? {
            title: `Mark ${amount} as received?`,
            body: `This records that ${name(b.fromUserId)} paid you ${amount} for ${b.groupName}.`,
            confirmLabel: 'Mark received',
          }
        : {
            title: `Record a ${amount} payment?`,
            body: `This records that you paid ${name(b.toUserId)} ${amount} for ${b.groupName}. They confirm it before the balance changes.`,
            confirmLabel: 'Record payment',
          },
    );
    if (ok) settle.mutate(b);
  };

  const header = (
    <ScreenHeader
      back={{ fallback: '/expenses' as Href }}
      subtitle="Simplified balances across your groups."
      title="Who owes whom"
    />
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading balances…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen onRefresh={() => refetch()} refreshing={isRefetching}>
        {header}
        <ErrorState
          body="There was a problem loading who owes whom."
          onRetry={() => refetch()}
          retryLabel="Retry"
          title="Unable to load balances"
        />
      </Screen>
    );
  }

  const owed = sumByCurrency(data.filter((b) => b.toUserId === currentUserId));
  const owe = sumByCurrency(data.filter((b) => b.fromUserId === currentUserId));
  const currencies = [...new Set([...owed.keys(), ...owe.keys()])];
  const net = netByCurrency(data, currentUserId);

  return (
    <Screen onRefresh={() => refetch()} refreshing={isRefetching}>
      {header}

      {currencies.length > 0 ? (
        <YStack gap="$x2">
          {currencies.map((currency) => (
            <XStack gap="$x3" key={currency}>
              <Card flex={1} variant="filled">
                <AppText tone="muted" variant="caption">
                  You are owed{currencies.length > 1 ? ` (${currency})` : ''}
                </AppText>
                <AppText tone="success" variant="h4">
                  {formatMoney(owed.get(currency) ?? 0, currency, { absolute: true })}
                </AppText>
              </Card>
              <Card flex={1} variant="filled">
                <AppText tone="muted" variant="caption">
                  You owe{currencies.length > 1 ? ` (${currency})` : ''}
                </AppText>
                <AppText tone="warm" variant="h4">
                  {formatMoney(owe.get(currency) ?? 0, currency, { absolute: true })}
                </AppText>
              </Card>
            </XStack>
          ))}
          {[...net.entries()].map(([currency, amount]) => (
            <AppText key={currency} tone="muted" variant="caption">
              Net in {currency}: {amount > 0 ? 'you are owed' : 'you owe'}{' '}
              {formatMoney(amount, currency, { absolute: true })}
            </AppText>
          ))}
        </YStack>
      ) : null}

      {data.length === 0 ? (
        <EmptyState
          actionLabel="Back to expenses"
          body="Nobody owes anything in your groups right now."
          iconName="check"
          onAction={() => router.push('/expenses' as Href)}
          title="All settled up"
        />
      ) : (
        <YStack gap="$x3">
          {data.map((b) => {
            const owedToMe = b.toUserId === currentUserId;
            const involved = owedToMe || b.fromUserId === currentUserId;
            const amount = formatMoney(b.amount, b.currency, { absolute: true });
            return (
              <Card key={balanceKey(b)}>
                <XStack alignItems="center" gap="$x3">
                  <YStack flex={1} gap={2}>
                    <AppText variant="bodyStrong">
                      {name(b.fromUserId)} {b.fromUserId === currentUserId ? 'owe' : 'owes'}{' '}
                      {name(b.toUserId)}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {b.groupName}
                    </AppText>
                  </YStack>
                  <AppText tone={owedToMe ? 'success' : 'warm'} variant="bodyStrong">
                    {amount}
                  </AppText>
                </XStack>
                {involved ? (
                  <AppButton
                    icon="check"
                    label={
                      owedToMe
                        ? `Mark ${amount} from ${name(b.fromUserId)} received`
                        : `Record paying ${name(b.toUserId)} ${amount}`
                    }
                    loading={settlingKey === balanceKey(b)}
                    onPress={() => void askSettle(b)}
                    size="sm"
                    variant="secondary"
                  />
                ) : null}
              </Card>
            );
          })}
        </YStack>
      )}

      <AppButton label="Settlement history" route="/expenses/settlements" variant="secondary" />
    </Screen>
  );
}
