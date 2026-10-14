import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { YStack } from 'tamagui';
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
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

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

  // The detail screen marks the notification read once it loads, so opening never sends a second request.
  const open = (item: NotificationItem) => {
    router.push(`/notifications/${item.id}` as Href);
  };

  const items = inbox.data?.pages.flatMap((page) => page.items) ?? [];
  const unread = inbox.data?.pages[0]?.unreadCount ?? 0;

  const header = (
    <ScreenHeader
      actions={
        <AppButton
          icon="settings"
          label="Settings"
          route="/notifications/settings"
          size="sm"
          variant="ghost"
        />
      }
      back={{ fallback: '/' as Href }}
      subtitle={
        inbox.data ? (unread > 0 ? `${unread} unread` : 'You are all caught up') : undefined
      }
      title="Notifications"
    />
  );

  if (inbox.isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading notifications..." />
      </Screen>
    );
  }

  if (inbox.isError) {
    return (
      <Screen onRefresh={() => inbox.refetch()} refreshing={inbox.isRefetching}>
        {header}
        <ErrorState
          title="Unable to load notifications"
          body={inbox.error instanceof Error ? inbox.error.message : 'Please try again.'}
          retryLabel="Retry"
          onRetry={() => inbox.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      onRefresh={() => inbox.refetch()}
      refreshing={inbox.isRefetching && !inbox.isFetchingNextPage}
    >
      <YStack gap="$x4">
        {header}

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
            actionLabel="Notification settings"
            onAction={() => router.push('/notifications/settings' as Href)}
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
