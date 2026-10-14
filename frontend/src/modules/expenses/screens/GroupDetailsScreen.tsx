import { formatDate, formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { useChatContacts } from '@/modules/chat';
import {
  addGroupMember,
  getExpenseGroup,
  listGroupBalances,
  listGroupExpenses,
  listGroupMembers,
  memberLabel,
  removeGroupMember,
} from '@/modules/expenses/api';
import { categoryLabel, hasOpenBalance, isUuid, localDate } from '@/modules/expenses/expenseMath';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { showError } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

type GroupDetailsScreenProps = {
  groupId: string;
};

/**
 * Adds a member by user id (the only identifier `POST /groups/{id}/members` accepts): pick someone you already chat
 * with, or paste a member id they shared with you.
 */
function AddMemberSheet({
  visible,
  onClose,
  groupId,
  memberIds,
}: {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  memberIds: string[];
}) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const contacts = useChatContacts(currentUserId, visible);
  const [manualId, setManualId] = useState('');
  const [manualTouched, setManualTouched] = useState(false);

  const add = useMutation({
    mutationFn: (userId: string) => addGroupMember(groupId, userId),
    onSuccess: (ids) => {
      queryClient.setQueryData(['expenses', 'group', groupId, 'members'], ids);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setManualId('');
      setManualTouched(false);
    },
    onError: (err) => showError('Could not add the member', err),
  });

  const candidates = (contacts.data ?? []).filter((c) => !memberIds.includes(c.userId));
  const manualError =
    manualTouched && !isUuid(manualId)
      ? 'Paste the full member id, like 3f2a1c9e-…'
      : manualTouched && memberIds.includes(manualId.trim().toLowerCase())
        ? 'That person is already in the group.'
        : null;

  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      size="tall"
      subtitle="Members can add expenses and see the group's balances."
      title="Add a member"
      visible={visible}
    >
      <YStack gap="$x4">
        <Section title="People you chat with">
          {contacts.isLoading ? (
            <LoadingState label="Loading your contacts…" />
          ) : contacts.isError ? (
            <ErrorState
              body="Check your connection and try again."
              compact
              onRetry={() => contacts.refetch()}
              retryLabel="Retry"
              title="Unable to load your contacts"
            />
          ) : candidates.length === 0 ? (
            <AppText tone="muted" variant="caption">
              {(contacts.data ?? []).length === 0
                ? 'You have no chats yet. Add someone by their member id below.'
                : 'Everyone you chat with is already in this group.'}
            </AppText>
          ) : (
            <YStack gap="$x2">
              {candidates.map((c) => (
                <PersonRow
                  actions={
                    <AppButton
                      icon="plus"
                      label="Add"
                      loading={add.isPending && add.variables === c.userId}
                      onPress={() => add.mutate(c.userId)}
                      size="sm"
                      variant="secondary"
                    />
                  }
                  key={c.userId}
                  name={c.label}
                  subtitle={`In ${c.sharedIn.map((s) => s.title).join(', ')}`}
                />
              ))}
            </YStack>
          )}
        </Section>
        <Section title="Add by member id">
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            error={manualError}
            helper="Their full member id (a long code with dashes). Picking from your chats is easier."
            label="Member id"
            onChangeText={setManualId}
            value={manualId}
          />
          <AppButton
            label="Add member"
            loading={add.isPending && add.variables === manualId.trim().toLowerCase()}
            onPress={() => {
              setManualTouched(true);
              const id = manualId.trim().toLowerCase();
              if (!isUuid(id) || memberIds.includes(id)) return;
              add.mutate(id);
            }}
            variant="secondary"
          />
        </Section>
      </YStack>
    </BottomSheet>
  );
}

export function GroupDetailsScreen({ groupId }: GroupDetailsScreenProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [adding, setAdding] = useState(false);
  const group = useQuery({
    queryKey: ['expenses', 'group', groupId],
    queryFn: () => getExpenseGroup(groupId),
    enabled: !!groupId,
  });
  const expenses = useQuery({
    queryKey: ['expenses', 'group', groupId, 'expenses'],
    queryFn: () => listGroupExpenses(groupId),
    enabled: !!groupId,
  });
  const members = useQuery({
    queryKey: ['expenses', 'group', groupId, 'members'],
    queryFn: () => listGroupMembers(groupId),
    enabled: !!groupId,
  });
  const groupBalances = useQuery({
    queryKey: ['expenses', 'group', groupId, 'balances'],
    queryFn: () => listGroupBalances(groupId),
    enabled: !!groupId,
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeGroupMember(groupId, userId),
    onSuccess: (_void, userId) => {
      // Leaving: go first, so this screen does not refetch a group the caller can no longer read.
      if (userId === currentUserId) router.replace('/expenses' as Href);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err) => showError('Could not update the group', err),
  });

  const refresh = () => {
    group.refetch();
    expenses.refetch();
    members.refetch();
    groupBalances.refetch();
  };
  const header = (subtitle?: string, title = 'Expense group') => (
    <ScreenHeader
      back={{ fallback: '/expenses/groups' as Href }}
      primaryAction={
        group.data
          ? {
              label: 'Add expense',
              icon: 'plus',
              route: `/expenses/add?groupId=${encodeURIComponent(groupId)}` as Href,
            }
          : undefined
      }
      subtitle={subtitle}
      title={title}
    />
  );

  if (group.isLoading || expenses.isLoading) {
    return (
      <Screen>
        {header()}
        <LoadingState label="Loading group…" />
      </Screen>
    );
  }

  if (group.error || expenses.error || !group.data || !expenses.data) {
    return (
      <Screen onRefresh={refresh}>
        {header()}
        <ErrorState
          body="This group does not exist, or you are not a member of it."
          onRetry={refresh}
          retryLabel="Retry"
          title="Unable to load group"
        />
      </Screen>
    );
  }

  const info = group.data;
  const isOwner = info.createdBy === currentUserId;
  const memberIds = (members.data ?? []).map((id) => id.toLowerCase());

  const askRemove = async (userId: string) => {
    const self = userId === currentUserId;
    const who = memberLabel(userId, currentUserId);
    if (!groupBalances.data) {
      showError(
        'Balances not loaded',
        'Pull to refresh so we can check that nobody is left owing money, then try again.',
      );
      return;
    }
    if (hasOpenBalance(groupBalances.data, userId)) {
      // The server refuses (409) too: once someone is gone their debts could never be settled.
      const ok = await confirm({
        title: 'Settle up first',
        body: self
          ? `You still owe or are owed money in ${info.name}. Record the payments on Balances, then you can leave.`
          : `${who} still owes or is owed money in ${info.name}. Settle those balances before removing them.`,
        confirmLabel: 'Open balances',
      });
      if (ok) router.push('/expenses/balances' as Href);
      return;
    }
    const ok = await confirm(
      self
        ? {
            title: `Leave ${info.name}?`,
            body: 'You will lose access to its expenses, balances and history. The group owner can add you back.',
            confirmLabel: 'Leave group',
            destructive: true,
          }
        : {
            title: `Remove ${who}?`,
            body: 'They are all settled up. They will no longer see this group; expenses they shared stay in the history.',
            confirmLabel: 'Remove',
            destructive: true,
          },
    );
    if (ok) remove.mutate(userId);
  };

  return (
    <Screen onRefresh={refresh} refreshing={group.isRefetching || expenses.isRefetching}>
      {header(
        `${info.memberCount} ${info.memberCount === 1 ? 'member' : 'members'} · ${formatMoney(
          info.totalExpenses,
          info.currency,
        )} spent`,
        info.name,
      )}
      {info.description ? (
        <AppText tone="muted" variant="body">
          {info.description}
        </AppText>
      ) : null}

      <Section title="Expenses">
        {expenses.data.length === 0 ? (
          <EmptyState
            actionLabel="Add expense"
            body="Add the first bill to start splitting it."
            compact
            iconName="receipt"
            onAction={() =>
              router.push(`/expenses/add?groupId=${encodeURIComponent(groupId)}` as Href)
            }
            title="No expenses yet"
          />
        ) : (
          <YStack gap="$x2">
            {expenses.data.map((expense) => (
              <Card key={expense.id}>
                <XStack alignItems="center" gap="$x3">
                  <YStack flex={1} gap={2}>
                    <AppText variant="bodyStrong">{expense.title}</AppText>
                    <AppText tone="muted" variant="caption">
                      {categoryLabel(expense.category)} · paid by{' '}
                      {memberLabel(expense.payerId, currentUserId)} ·{' '}
                      {formatDate(localDate(expense.expenseDate), 'short')}
                    </AppText>
                  </YStack>
                  <AppText variant="bodyStrong">
                    {formatMoney(expense.amount, expense.currency || info.currency)}
                  </AppText>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      </Section>

      <Section title="Members">
        {members.isLoading ? (
          <LoadingState label="Loading members…" />
        ) : members.isError ? (
          <ErrorState
            body="Check your connection and try again."
            compact
            onRetry={() => members.refetch()}
            retryLabel="Retry"
            title="Unable to load members"
          />
        ) : (
          <YStack gap="$x2">
            {(members.data ?? []).map((userId) => {
              const owner = userId === info.createdBy;
              const self = userId === currentUserId;
              const canRemove = !owner && (isOwner || self);
              return (
                <PersonRow
                  actions={
                    canRemove ? (
                      <AppButton
                        label={self ? 'Leave' : 'Remove'}
                        loading={remove.isPending && remove.variables === userId}
                        onPress={() => void askRemove(userId)}
                        size="sm"
                        variant="ghost"
                      />
                    ) : undefined
                  }
                  badge={owner ? <StatusBadge label="Owner" tone="info" /> : undefined}
                  subtitle={
                    groupBalances.data && hasOpenBalance(groupBalances.data, userId)
                      ? 'Has an open balance'
                      : undefined
                  }
                  key={userId}
                  name={memberLabel(userId, currentUserId)}
                />
              );
            })}
            {isOwner ? (
              <AppButton
                icon="plus"
                label="Add member"
                onPress={() => setAdding(true)}
                variant="secondary"
              />
            ) : null}
          </YStack>
        )}
      </Section>

      <XStack flexWrap="wrap" gap="$x2">
        <AppButton label="Balances" route="/expenses/balances" variant="secondary" />
        <AppButton label="Settlements" route="/expenses/settlements" variant="ghost" />
      </XStack>

      {isOwner ? (
        <AddMemberSheet
          groupId={groupId}
          memberIds={memberIds}
          onClose={() => setAdding(false)}
          visible={adding}
        />
      ) : null}
    </Screen>
  );
}
