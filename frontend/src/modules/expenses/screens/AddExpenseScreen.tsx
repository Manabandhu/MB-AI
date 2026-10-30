import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { YStack } from 'tamagui';
import { createExpense, listExpenseGroups } from '@/modules/expenses/api';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryId,
  parseAmount,
  toLocalDateString,
} from '@/modules/expenses/expenseMath';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { showMessage } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

/**
 * Records an expense in one of your groups, split equally between its members (the only split the app offers).
 * The amount is parsed strictly and rounded to cents; on success it confirms and goes back.
 */
export function AddExpenseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groups = useQuery({ queryKey: ['expenses', 'groups'], queryFn: listExpenseGroups });
  const [pickedGroupId, setPickedGroupId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryId>('GROCERIES');
  const [touched, setTouched] = useState(false);

  const groupList = groups.data ?? [];
  const groupId =
    pickedGroupId ??
    (params.groupId && groupList.some((g) => g.id === params.groupId) ? params.groupId : null) ??
    groupList[0]?.id ??
    null;
  const group = groupList.find((g) => g.id === groupId);
  const currency = group?.currency ?? 'USD';
  const parsed = parseAmount(amount);
  const amountError = touched ? parsed.error : null;
  const titleError = touched && !title.trim() ? 'Say what the expense was for.' : null;

  const save = useMutation({
    mutationFn: () =>
      createExpense({
        groupId: groupId ?? '',
        title: title.trim(),
        amount: parsed.value ?? 0,
        category,
        splitType: 'EQUAL',
        expenseDate: toLocalDateString(),
      }),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showMessage(
        'Expense added',
        `${formatMoney(expense.amount, expense.currency || currency)} for "${expense.title}" was split equally in ${group?.name ?? 'your group'}.`,
      );
      if (router.canGoBack()) router.back();
      else router.replace(`/expenses/groups/${groupId}` as Href);
    },
  });

  const onSubmit = () => {
    setTouched(true);
    if (!groupId || parsed.error || !title.trim()) return;
    save.mutate();
  };

  const header = (
    <ScreenHeader
      back={{ fallback: '/expenses' as Href }}
      subtitle="Split equally between everyone in the group."
      title="Add an expense"
    />
  );

  if (groups.isLoading) {
    return (
      <Screen maxWidth="form">
        {header}
        <LoadingState label="Loading your groups…" />
      </Screen>
    );
  }
  if (groups.isError) {
    return (
      <Screen maxWidth="form">
        {header}
        <ErrorState
          body="Your groups could not be loaded, so the expense cannot be added yet."
          onRetry={() => groups.refetch()}
          retryLabel="Retry"
          title="Unable to load groups"
        />
      </Screen>
    );
  }
  if (groupList.length === 0) {
    return (
      <Screen maxWidth="form">
        {header}
        <EmptyState
          actionLabel="Create a group"
          body="Expenses belong to a group. Create one for your flat, trip, or carpool first."
          iconName="wallet"
          onAction={() => router.push('/expenses/groups' as Href)}
          title="No expense groups yet"
        />
      </Screen>
    );
  }

  return (
    <YStack flex={1}>
      <Screen bottomInset={ACTION_BAR_SPACE} keyboardAvoiding maxWidth="form">
        {header}
        <Card gap="$x4">
          <YStack gap="$x2">
            <AppText variant="label">Group</AppText>
            <FilterChipRow label="Group" role="radiogroup">
              {groupList.map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  onPress={() => setPickedGroupId(g.id)}
                  radio
                  selected={g.id === groupId}
                />
              ))}
            </FilterChipRow>
          </YStack>
          <TextField
            error={amountError}
            helper={`Amount in ${currency}`}
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Amount"
            maxLength={14}
            onChangeText={setAmount}
            placeholder="0.00"
            value={amount}
          />
          <TextField
            error={titleError}
            label="What was it for?"
            maxLength={150}
            onChangeText={setTitle}
            placeholder="e.g. Groceries, electricity bill"
            value={title}
          />
          <YStack gap="$x2">
            <AppText variant="label">Category</AppText>
            <FilterChipRow label="Category" role="radiogroup">
              {EXPENSE_CATEGORIES.map((c) => (
                <Chip
                  icon={c.icon}
                  key={c.id}
                  label={c.label}
                  onPress={() => setCategory(c.id)}
                  radio
                  selected={category === c.id}
                />
              ))}
            </FilterChipRow>
          </YStack>
          {save.isError ? (
            <AppText role="alert" tone="danger" variant="caption">
              {save.error instanceof Error ? save.error.message : 'Unable to add the expense.'}{' '}
              Please try again.
            </AppText>
          ) : null}
        </Card>
      </Screen>
      <ActionBar
        label="Save expense"
        leading={
          parsed.value !== null ? (
            <AppText variant="bodyStrong">{formatMoney(parsed.value, currency)}</AppText>
          ) : undefined
        }
      >
        <AppButton label="Save expense" loading={save.isPending} onPress={onSubmit} />
      </ActionBar>
    </YStack>
  );
}
