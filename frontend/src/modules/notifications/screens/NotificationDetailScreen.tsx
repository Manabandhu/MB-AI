import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  getNotificationDetail,
  markNotificationRead,
  notificationKeys,
} from '@/modules/notifications/api';
import { notificationVisual } from '@/modules/notifications/components/notificationVisuals';
import { routeForPushData } from '@/modules/notifications/utils/pushRoutes';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
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
  // Marks read once per opened notification (the inbox only navigates here), so there is a single request.
  const markedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!notification || notification.read || markedRef.current === notification.id) return;
    markedRef.current = notification.id;
    mutate(notification.id);
  }, [notification, mutate]);

  if (detail.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/notifications" />
        <LoadingState label="Loading notification..." />
      </Screen>
    );
  }

  if (detail.isError || !notification) {
    return (
      <Screen>
        <BackButton fallback="/notifications" />
        <ErrorState
          title="Notification not available"
          body="It may have been removed, or it belongs to another account."
          retryLabel="Back to inbox"
          onRetry={() => router.replace('/notifications' as Href)}
        />
      </Screen>
    );
  }

  const visual = notificationVisual(notification.meta);
  // Only in-app paths are followed, never external or protocol-relative URLs.
  const target = notification.route ? routeForPushData({ route: notification.route }) : null;
  return (
    <Screen>
      <YStack gap="$x5">
        <BackButton fallback="/notifications" />
        <YStack gap="$x2">
          <XStack gap="$x2">
            <Chip label={visual.label} variant="tag" />
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
