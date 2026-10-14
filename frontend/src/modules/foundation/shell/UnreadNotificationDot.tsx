import { useQuery } from '@tanstack/react-query';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getUnreadNotificationCount, notificationKeys } from '@/modules/notifications/api';

/** Shows a dot only when the server reports unread notifications; nothing while loading, signed out, or on error. */
export function UnreadNotificationDot() {
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const { data } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadNotificationCount,
    enabled: signedIn,
    refetchInterval: 60_000,
  });
  if (!signedIn || !data || data <= 0) return null;
  return (
    <YStack
      aria-label={`${data} unread notifications`}
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
