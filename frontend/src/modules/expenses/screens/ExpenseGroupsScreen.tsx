import { color, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  createExpenseGroup,
  type ExpenseGroup,
  type ExpenseGroupType,
  listExpenseGroups,
} from '@/modules/expenses/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

const GROUP_TYPES: ExpenseGroupType[] = ['APARTMENT', 'TRIP', 'CARPOOL', 'EVENT'];

function formatMoney(amount: number, currency: string) {
  return `${currency === 'USD' ? '$' : `${currency} `}${amount.toFixed(2)}`;
}

export function ExpenseGroupsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<ExpenseGroupType>('APARTMENT');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', 'groups'],
    queryFn: listExpenseGroups,
  });
  const create = useMutation({
    mutationFn: createExpenseGroup,
    onSuccess: (group) => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.push(`/expenses/groups/${group.id}`);
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading groups..." />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load groups"
          body="There was a problem loading your expense groups."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader
        eyebrow="Shared expenses"
        title="Your groups"
        subtitle="Split rent, utilities, trips, and carpools with the people you live and travel with."
      />

      <View style={styles.createCard}>
        <Text style={styles.label}>New group</Text>
        <TextInput
          accessibilityLabel="Group name"
          placeholder="e.g. Arbor Oaks 2BHK"
          placeholderTextColor={color.muted}
          value={name}
          onChangeText={setName}
          style={styles.input}
          maxLength={120}
        />
        <View style={styles.chips}>
          {GROUP_TYPES.map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityState={{ selected: type === groupType }}
              onPress={() => setGroupType(type)}
              style={[styles.chip, type === groupType && styles.chipActive]}
            >
              <Text style={[styles.chipText, type === groupType && styles.chipTextActive]}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        {create.error ? <Text style={styles.error}>{create.error.message}</Text> : null}
        <AppButton
          label="Create group"
          loading={create.isPending}
          disabled={!name.trim()}
          onPress={() => create.mutate({ name: name.trim(), groupType })}
        />
      </View>

      {data.length === 0 ? (
        <EmptyState
          title="No groups yet"
          body="Create your first expense group above to start tracking shared spending."
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      ) : (
        <View style={styles.list}>
          {data.map((group: ExpenseGroup) => (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.name}`}
              onPress={() => router.push(`/expenses/groups/${group.id}`)}
              style={styles.groupCard}
            >
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.groupType.toLowerCase()} · {group.memberCount}{' '}
                {group.memberCount === 1 ? 'member' : 'members'} ·{' '}
                {formatMoney(group.totalExpenses, group.currency)} total
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  createCard: {
    gap: space.x3,
    marginTop: space.x4,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  label: { ...typography.caption, color: color.muted, textTransform: 'uppercase' },
  input: {
    ...typography.body,
    color: color.ink,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  chip: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
  },
  chipActive: { backgroundColor: color.primarySoft, borderColor: color.primary },
  chipText: { ...typography.caption, color: color.muted },
  chipTextActive: { color: color.primary },
  error: { ...typography.caption, color: color.error },
  list: { gap: space.x3, marginTop: space.x4 },
  groupCard: {
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    gap: space.x1,
  },
  groupName: { ...typography.h4, color: color.ink },
  groupMeta: { ...typography.caption, color: color.muted },
});
