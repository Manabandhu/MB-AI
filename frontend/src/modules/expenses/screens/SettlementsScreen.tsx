import { formatDate, formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  listSettlements,
  memberLabel,
  type Settlement,
  updateSettlementStatus,
} from '@/modules/expenses/api';
import { settlementStatus } from '@/modules/expenses/expenseMath';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** History of recorded payments. The recipient confirms a pending payment; either side can cancel it. */
export function SettlementsScreen() {
  const router = useRouter();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const name = (userId: string) => memberLabel(userId, currentUserId);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', 'settlements'],
    queryFn: listSettlements,
  });
  const update = useMutation({
    mutationFn: (v: { id: string; status: 'completed' | 'cancelled' }) =>
      updateSettlementStatus(v.id, v.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err) => showError('Unable to update the payment', err),
  });
  const busyId = update.isPending ? update.variables?.id : undefined;

  const askConfirm = async (s: Settlement) => {
    const amount = formatMoney(s.amount, s.currency, { absolute: true });
    const ok = await confirm({
      title: `Confirm you received ${amount}?`,
      body: `This settles ${amount} from ${name(s.fromUserId)} and updates the balance.`,
      confirmLabel: 'Confirm received',
    });
    if (ok) update.mutate({ id: s.id, status: 'completed' });
  };

  const askCancel = async (s: Settlement) => {
    const amount = formatMoney(s.amount, s.currency, { absolute: true });
    const ok = await confirm({
      title: `Cancel this ${amount} payment?`,
      body: 'The payment record is cancelled and the balance stays as it was. This cannot be undone.',
      confirmLabel: 'Cancel payment',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (ok) update.mutate({ id: s.id, status: 'cancelled' });
  };

  const header = (
    <ScreenHeader
      back={{ fallback: '/expenses' as Href }}
      subtitle="Payments recorded between group members."
      title="Settlements"
    />
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading settlements…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen onRefresh={() => refetch()} refreshing={isRefetching}>
        {header}
        <ErrorState
          body="There was a problem loading your settlement history."
          onRetry={() => refetch()}
          retryLabel="Retry"
          title="Unable to load settlements"
        />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={() => refetch()} refreshing={isRefetching}>
      {header}
      {data.length === 0 ? (
        <EmptyState
          actionLabel="View balances"
          body="No payments have been recorded yet."
          iconName="wallet"
          onAction={() => router.push('/expenses/balances' as Href)}
          title="No settlements yet"
        />
      ) : (
        <YStack gap="$x3">
          {data.map((s) => {
            const status = settlementStatus(s.status);
            const pending = status.key === 'pending';
            return (
              <Card key={s.id}>
                <XStack alignItems="center" justifyContent="space-between">
                  <StatusBadge label={status.label} tone={status.tone} />
                  <AppText tone="muted" variant="caption">
                    {formatDate(s.settledAt ?? s.createdAt, 'short')}
                  </AppText>
                </XStack>
                <XStack alignItems="center" gap="$x3">
                  <AppText flex={1} variant="bodyStrong">
                    {name(s.fromUserId)} paid {name(s.toUserId)}
                  </AppText>
                  <AppText variant="bodyStrong">
                    {formatMoney(s.amount, s.currency, { absolute: true })}
                  </AppText>
                </XStack>
                {pending ? (
                  <YStack gap="$x2">
                    {s.toUserId === currentUserId ? null : (
                      <AppText tone="muted" variant="caption">
                        Waiting for {name(s.toUserId)} to confirm.
                      </AppText>
                    )}
                    <XStack flexWrap="wrap" gap="$x2">
                      {s.toUserId === currentUserId ? (
                        <AppButton
                          label="Confirm received"
                          loading={busyId === s.id && update.variables?.status === 'completed'}
                          onPress={() => void askConfirm(s)}
                          size="sm"
                        />
                      ) : null}
                      <AppButton
                        label="Cancel payment"
                        loading={busyId === s.id && update.variables?.status === 'cancelled'}
                        onPress={() => void askCancel(s)}
                        size="sm"
                        variant="ghost"
                      />
                    </XStack>
                  </YStack>
                ) : null}
              </Card>
            );
          })}
        </YStack>
      )}
      <AppButton label="Current balances" route="/expenses/balances" variant="secondary" />
    </Screen>
  );
}
