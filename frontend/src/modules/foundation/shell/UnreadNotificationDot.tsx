import { useQuery } from '@tanstack/react-query';
import { YStack } from 'tamagui';
import { getNotificationsInbox } from '@/modules/notifications/api';

/** Shows a dot only when the inbox really has unread items; nothing while loading or on error. */
export function UnreadNotificationDot() {
  const { data } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: getNotificationsInbox,
  });
  const hasUnread = (data?.items ?? []).some((item) => !item.read);
  if (!hasUnread) return null;
  return (
    <YStack
      aria-label="Unread notifications"
      backgroundColor="$warm"
      borderColor="$surface"
      borderRadius="$pill"
      borderWidth={2}
      height={12}
      position="absolute"
      right={8}
      top={8}
      width={12}
    />
  );
}
