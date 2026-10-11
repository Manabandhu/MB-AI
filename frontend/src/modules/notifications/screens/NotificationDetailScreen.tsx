import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  getNotificationDetail,
  markNotificationRead,
  notificationKeys,
} from '@/modules/notifications/api';
import { notificationVisual } from '@/modules/notifications/components/notificationVisuals';
import { routeForPushData } from '@/modules/notifications/pushRoutes';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';

/** One notification. Opening it (from the inbox or a push) marks it read; "Open" goes to the related screen. */
export function NotificationDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useQuery({
    queryKey: notificationKeys.detail(id ?? ''),
    queryFn: () => getNotificationDetail(id ?? ''),
    enabled: Boolean(id),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData(notificationKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
  const notification = detail.data;
  const { mutate } = markRead;
  useEffect(() => {
    if (notification && !notification.read) mutate(notification.id);
  }, [notification, mutate]);

  if (detail.isLoading) return <LoadingState label="Loading notification..." />;

  if (detail.isError || !notification) {
    return (
      <ErrorState
        title="Notification not available"
        body="It may have been removed, or it belongs to another account."
        retryLabel="Back to inbox"
        onRetry={() => router.replace('/notifications' as Href)}
      />
    );
  }

  const visual = notificationVisual(notification.meta);
  // Only in-app paths are followed, never external or protocol-relative URLs.
  const target = notification.route ? routeForPushData({ route: notification.route }) : null;
  return (
    <Screen>
      <YStack gap="$x5">
        <YStack gap="$x2">
          <XStack gap="$x2">
            <Chip label={visual.label} />
          </XStack>
          <AppText role="heading" variant="h2">
            {notification.title}
          </AppText>
          {notification.createdAt ? (
            <AppText tone="muted" variant="caption">
              {formatDate(notification.createdAt, 'long')}
            </AppText>
          ) : null}
        </YStack>
        <Card padding="$x4">
          <AppText variant="body">{notification.body}</AppText>
        </Card>
        <YStack gap="$x3">
          {target ? (
            <AppButton
              iconAfter="arrow-right"
              label="Open"
              onPress={() => router.push(target as Href)}
            />
          ) : null}
          <AppButton label="Back to inbox" route="/notifications" variant="secondary" />
        </YStack>
      </YStack>
    </Screen>
  );
}
