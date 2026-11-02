import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { YStack } from 'tamagui';
import { type BlockedUserItem, getBlockedUsers, unblockUser } from '@/modules/safety/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { showError } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

/** Short, stable label until the app has a profile directory; never an invented name. */
const memberLabel = (userId: string) => `Member ${userId.slice(0, 4).toUpperCase()}`;

/** Members you blocked; unblocking asks first. */
export function BlockedUsersScreen() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const users = useQuery({ queryKey: ['safety', 'blocked-users'], queryFn: getBlockedUsers });
  const unblock = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety'] }),
    onError: (err) => showError('Unable to unblock', err),
  });

  const askUnblock = async (item: BlockedUserItem) => {
    const ok = await confirm({
      title: `Unblock ${memberLabel(item.blockedUserId)}?`,
      body: 'They will be removed from your blocked list. You can block them again later.',
      confirmLabel: 'Unblock',
      destructive: true,
    });
    if (ok) unblock.mutate(item.blockedUserId);
  };

  const body = () => {
    if (users.isLoading) return <LoadingState count={3} variant="skeleton" />;
    if (users.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => users.refetch()}
          retryLabel="Retry"
          title="Unable to load blocked users"
        />
      );
    }
    const data = users.data ?? [];
    if (data.length === 0) {
      return (
        <EmptyState
          body="Members you block appear here."
          iconName="eye-closed"
          title="No blocked users"
        />
      );
    }
    return (
      <YStack gap="$x2">
        {data.map((item) => (
          <PersonRow
            actions={
              <AppButton
                label="Unblock"
                loading={unblock.isPending && unblock.variables === item.blockedUserId}
                onPress={() => void askUnblock(item)}
                size="sm"
                variant="secondary"
              />
            }
            detail={
              item.reason ? (
                <AppText tone="muted" variant="caption">
                  {item.reason}
                </AppText>
              ) : undefined
            }
            key={item.id}
            name={memberLabel(item.blockedUserId)}
            subtitle={`Blocked ${formatDate(item.createdAt, 'short')}`}
          />
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => users.refetch()} refreshing={users.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/safety' as Href }}
        subtitle="Members you have blocked."
        title="Blocked users"
      />
      {body()}
    </Screen>
  );
}
