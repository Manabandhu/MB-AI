import { formatRelative } from '@manabandhu/core';
import { Platform } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { XStack, YStack } from 'tamagui';
import type { NotificationItem } from '@/modules/notifications/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useAppearance } from '@/theme/ThemeProvider';
import { notificationVisual, toneBackground, toneColorKey } from './notificationVisuals';

type Props = {
  item: NotificationItem;
  onOpen: () => void;
  onMarkRead: () => void;
};

/**
 * One inbox row. Unread rows carry a dot and bold title. On phones a swipe reveals "Mark read"; the same action is
 * always available as a button so it works with screen readers, keyboards, and the web.
 */
export function NotificationRow({ item, onOpen, onMarkRead }: Props) {
  const { palette } = useAppearance();
  const visual = notificationVisual(item.meta);
  const when = item.createdAt ? formatRelative(item.createdAt) : null;

  const row = (
    <Card
      aria-label={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}${when ? `. ${when}` : ''}`}
      onPress={onOpen}
      padding="$x3"
    >
      <XStack alignItems="center" gap="$x3">
        <YStack
          alignItems="center"
          backgroundColor={toneBackground[visual.tone]}
          borderRadius="$control"
          height={44}
          justifyContent="center"
          width={44}
        >
          <AppIcon color={palette[toneColorKey[visual.tone]]} name={visual.icon} size={20} />
        </YStack>
        <YStack flex={1} gap={2}>
          <XStack alignItems="center" gap="$x2">
            {item.read ? null : (
              <YStack backgroundColor="$warm" borderRadius="$pill" height={8} width={8} />
            )}
            <AppText flex={1} numberOfLines={1} variant={item.read ? 'body' : 'bodyStrong'}>
              {item.title}
            </AppText>
          </XStack>
          <AppText numberOfLines={2} tone="muted" variant="caption">
            {item.body}
          </AppText>
          <AppText tone="muted" variant="caption">
            {[visual.label, when].filter(Boolean).join(' · ')}
          </AppText>
        </YStack>
        {item.read ? null : (
          <IconButton
            icon="check"
            label={`Mark "${item.title}" as read`}
            onPress={onMarkRead}
            variant="plain"
          />
        )}
      </XStack>
    </Card>
  );

  if (Platform.OS === 'web' || item.read) return row;
  return (
    <ReanimatedSwipeable
      friction={2}
      onSwipeableOpen={onMarkRead}
      overshootRight={false}
      renderRightActions={() => (
        <XStack
          alignItems="center"
          backgroundColor="$primary"
          borderRadius="$card"
          paddingHorizontal="$x4"
        >
          <AppText color="$onPrimary" variant="label">
            Mark read
          </AppText>
        </XStack>
      )}
      rightThreshold={60}
    >
      {row}
    </ReanimatedSwipeable>
  );
}
