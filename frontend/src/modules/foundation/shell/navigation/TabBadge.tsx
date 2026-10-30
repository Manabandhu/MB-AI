import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { badgeText } from './unreadBadge';

/**
 * Count pill for a tab (caps at "99+"). `overlay` (default) sits on the icon's corner (bottom bar, rail); `inline`
 * follows the label (top bar, where the icon is too small to carry it). Decorative for screen readers: the tab's own
 * label carries the count ("Chat, 3 unread"). Renders nothing for zero or an unknown count.
 */
export function TabBadge({
  count,
  placement = 'overlay',
}: {
  count: number | undefined;
  placement?: 'overlay' | 'inline';
}) {
  const text = badgeText(count);
  if (!text) return null;
  const overlay = placement === 'overlay';
  return (
    <YStack
      aria-hidden
      alignItems="center"
      backgroundColor="$primary"
      borderColor="$surface"
      borderRadius="$pill"
      borderWidth={overlay ? 2 : 0}
      height={20}
      justifyContent="center"
      minWidth={20}
      paddingHorizontal={4}
      pointerEvents="none"
      position={overlay ? 'absolute' : 'relative'}
      right={overlay ? -10 : undefined}
      top={overlay ? -6 : undefined}
    >
      <AppText color="$onPrimary" fontSize={11} fontWeight="800" lineHeight={14}>
        {text}
      </AppText>
    </YStack>
  );
}
