import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { isSuspended } from '@/modules/admin/adminAccess';
import { listUsers } from '@/modules/admin/api';
import { memberRoleLabel, UserStatusBadge } from '@/modules/admin/components/AdminBits';
import { useUserStatusAction } from '@/modules/admin/hooks';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import {
  AppButton,
  AppText,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
  SkeletonCard,
  StatusBadge,
  TextField,
} from '@/modules/shared/ui';

/** Member accounts (latest 200) with search, a detail page per member, and confirmed suspend / reactivate. */
export default function AdminUsersScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: listUsers,
  });
  const { toggle, pendingId } = useUserStatusAction();

  const filtered = useMemo(() => {
    const users = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <ScreenHeader
        back={{ fallback: '/admin' as Href }}
        subtitle="Search accounts, open a member, or suspend access."
        title="Users"
      />
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        leadingIcon="search"
        onChangeText={setQuery}
        placeholder="Search by name or email"
        trailing={
          query ? (
            <IconButton
              icon="close"
              label="Clear search"
              onPress={() => setQuery('')}
              variant="plain"
            />
          ) : undefined
        }
        value={query}
      />
      {isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </YStack>
      ) : isError ? (
        <ErrorState
          body={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => void refetch()}
          title="Unable to load users"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          actionLabel={query ? 'Clear search' : undefined}
          body={query ? 'No account matches that name or email.' : 'No accounts yet.'}
          iconName="user"
          onAction={query ? () => setQuery('') : undefined}
          title="No users found"
        />
      ) : (
        <YStack gap="$x2">
          {filtered.map((u) => {
            const suspended = isSuspended(u.status);
            return (
              <Card key={u.id} padding="$x3">
                <YStack gap="$x2">
                  <YStack gap={2}>
                    <AppText numberOfLines={1} variant="bodyStrong">
                      {u.name}
                    </AppText>
                    <AppText numberOfLines={1} tone="muted" variant="caption">
                      {u.email}
                    </AppText>
                  </YStack>
                  <XStack flexWrap="wrap" gap="$x2">
                    <StatusBadge label={memberRoleLabel(u.role)} tone="neutral" />
                    <UserStatusBadge status={u.status} />
                  </XStack>
                  <XStack flexWrap="wrap" gap="$x2" justifyContent="flex-end">
                    <AppButton
                      label="Details"
                      route={`/admin/users/${u.id}`}
                      size="sm"
                      variant="ghost"
                    />
                    <AppButton
                      disabled={pendingId !== undefined && pendingId !== u.id}
                      label={suspended ? 'Reactivate' : 'Suspend'}
                      loading={pendingId === u.id}
                      onPress={() => void toggle(u)}
                      size="sm"
                      variant={suspended ? 'secondary' : 'danger'}
                    />
                  </XStack>
                </YStack>
              </Card>
            );
          })}
        </YStack>
      )}
    </Screen>
  );
}
