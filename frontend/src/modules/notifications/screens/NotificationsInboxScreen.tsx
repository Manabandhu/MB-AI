import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  getNotificationsInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationInboxPage,
  type NotificationItem,
  notificationKeys,
} from '@/modules/notifications/api';
import { NotificationRow } from '@/modules/notifications/components/NotificationRow';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Screen } from '@/modules/shared/ui/Screen';

type InboxData = InfiniteData<NotificationInboxPage, number>;

/** The caller's notifications, newest first, paged from the server, with mark-read and mark-all-read. */
export function NotificationsInboxScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inbox = useInfiniteQuery({
    queryKey: notificationKeys.inbox,
    queryFn: ({ pageParam }) => getNotificationsInbox(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const refreshCounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
  }, [queryClient]);

  // Optimistically flip the row so the dot clears at once; a failure restores the server's state.
  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.inbox });
      const previous = queryClient.getQueryData<InboxData>(notificationKeys.inbox);
      queryClient.setQueryData<InboxData>(notificationKeys.inbox, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
              })),
            }
          : data,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(notificationKeys.inbox, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      refreshCounts();
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      refreshCounts();
    },
  });

  const open = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item.id);
    router.push(`/notifications/${item.id}` as Href);
  };

  if (inbox.isLoading) return <LoadingState label="Loading notifications..." />;

  if (inbox.isError) {
    return (
      <ErrorState
        title="Unable to load notifications"
        body={inbox.error instanceof Error ? inbox.error.message : 'Please try again.'}
        retryLabel="Retry"
        onRetry={() => inbox.refetch()}
      />
    );
  }

  const items = inbox.data?.pages.flatMap((page) => page.items) ?? [];
  const unread = inbox.data?.pages[0]?.unreadCount ?? 0;

  return (
    <Screen
      onRefresh={() => inbox.refetch()}
      refreshing={inbox.isRefetching && !inbox.isFetchingNextPage}
    >
      <YStack gap="$x4">
        <XStack alignItems="center" gap="$x3" justifyContent="space-between">
          <YStack flex={1} gap={2}>
            <AppText role="heading" variant="h2">
              Notifications
            </AppText>
            <AppText tone="muted" variant="caption">
              {unread > 0 ? `${unread} unread` : 'You are all caught up'}
            </AppText>
          </YStack>
          <AppButton
            icon="settings"
            label="Settings"
            route="/notifications/settings"
            size="sm"
            variant="ghost"
          />
        </XStack>

        {unread > 0 ? (
          <AppButton
            disabled={markAll.isPending}
            icon="check"
            label="Mark all as read"
            loading={markAll.isPending}
            onPress={() => markAll.mutate()}
            size="sm"
            variant="secondary"
          />
        ) : null}
        {markAll.isError || markRead.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            Could not update read status. Pull to refresh and try again.
          </AppText>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            body="Ride requests, room inquiries, messages and other updates will show up here."
            iconName="bell"
          />
        ) : (
          <YStack gap="$x2">
            {items.map((item) => (
              <NotificationRow
                item={item}
                key={item.id}
                onMarkRead={() => markRead.mutate(item.id)}
                onOpen={() => open(item)}
              />
            ))}
          </YStack>
        )}

        {inbox.hasNextPage ? (
          <AppButton
            label="Load older notifications"
            loading={inbox.isFetchingNextPage}
            onPress={() => inbox.fetchNextPage()}
            variant="ghost"
          />
        ) : null}
      </YStack>
    </Screen>
  );
}
