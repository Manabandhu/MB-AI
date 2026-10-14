import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  createExpenseGroup,
  type ExpenseGroupType,
  listExpenseGroups,
} from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { TextField } from '@/modules/shared/ui/TextField';

const GROUP_TYPES: { value: ExpenseGroupType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'TRIP', label: 'Trip' },
  { value: 'CARPOOL', label: 'Carpool' },
  { value: 'EVENT', label: 'Event' },
];

/** Your expense groups and a form to create one; creating opens the new group so you can add members. */
export function ExpenseGroupsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<ExpenseGroupType>('APARTMENT');
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', 'groups'],
    queryFn: listExpenseGroups,
  });
  const create = useMutation({
    mutationFn: createExpenseGroup,
    onSuccess: (group) => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.push(`/expenses/groups/${group.id}` as Href);
    },
  });

  const list = () => {
    if (isLoading) return <LoadingState label="Loading groups…" />;
    if (error || !data) {
      return (
        <ErrorState
          body="There was a problem loading your expense groups."
          onRetry={() => refetch()}
          retryLabel="Retry"
          title="Unable to load groups"
        />
      );
    }
    if (data.length === 0) {
      return (
        <EmptyState
          body="Create your first group above to start tracking shared spending."
          compact
          iconName="wallet"
          title="No groups yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {data.map((group) => (
          <Card
            aria-label={`Open ${group.name}`}
            href={`/expenses/groups/${group.id}` as Href}
            key={group.id}
          >
            <XStack alignItems="center" gap="$x3">
              <YStack flex={1} gap={2}>
                <AppText variant="bodyStrong">{group.name}</AppText>
                <AppText tone="muted" variant="caption">
                  {GROUP_TYPES.find((t) => t.value === group.groupType)?.label ?? group.groupType} ·{' '}
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'} ·{' '}
                  {formatMoney(group.totalExpenses, group.currency)} total
                </AppText>
              </YStack>
              <AppIcon name="chevron-right" size={18} />
            </XStack>
          </Card>
        ))}
      </YStack>
    );
  };

  return (
    <Screen keyboardAvoiding onRefresh={() => refetch()} refreshing={isRefetching}>
      <ScreenHeader
        back={{ fallback: '/expenses' as Href }}
        subtitle="Split rent, utilities, trips, and carpools with the people you live and travel with."
        title="Your groups"
      />
      <Card gap="$x3">
        <AppText role="heading" variant="h4">
          New group
        </AppText>
        <TextField
          label="Group name"
          maxLength={120}
          onChangeText={setName}
          placeholder="e.g. Arbor Oaks 2BHK"
          value={name}
        />
        <FilterChipRow label="Group type" role="radiogroup">
          {GROUP_TYPES.map((type) => (
            <Chip
              key={type.value}
              label={type.label}
              onPress={() => setGroupType(type.value)}
              radio
              selected={type.value === groupType}
            />
          ))}
        </FilterChipRow>
        {create.error ? (
          <AppText role="alert" tone="danger" variant="caption">
            {create.error.message}
          </AppText>
        ) : null}
        <AppButton
          disabled={!name.trim()}
          label="Create group"
          loading={create.isPending}
          onPress={() => create.mutate({ name: name.trim(), groupType })}
        />
      </Card>
      <Section title="Groups">{list()}</Section>
    </Screen>
  );
}
