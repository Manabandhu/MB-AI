import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';

export type SwipeActionProps = {
  /** `color` is a theme token or palette value (e.g. `'$error'`, `palette.error`). */
  leftAction?: { label: string; color: string; onPress: () => void };
  rightAction?: { label: string; color: string; onPress: () => void };
  children: React.ReactNode;
};

function SideAction({ label, color, onPress }: NonNullable<SwipeActionProps['leftAction']>) {
  return (
    <YStack
      alignItems="center"
      aria-label={label}
      backgroundColor={color as never}
      cursor="pointer"
      focusVisibleStyle={{ outlineColor: '$outlineColor', outlineStyle: 'solid', outlineWidth: 3 }}
      justifyContent="center"
      minHeight={44}
      minWidth={80}
      onPress={onPress}
      paddingHorizontal="$x5"
      pressStyle={{ opacity: 0.85 }}
      role="button"
      {...keyboardPress(onPress, true)}
    >
      <AppText tone="onPrimary" variant="label">
        {label}
      </AppText>
    </YStack>
  );
}

/** Row with optional leading/trailing action buttons around the content. */
export function SwipeAction({ leftAction, rightAction, children }: SwipeActionProps) {
  return (
    <XStack overflow="hidden">
      {leftAction ? <SideAction {...leftAction} /> : null}
      <YStack flex={1}>{children}</YStack>
      {rightAction ? <SideAction {...rightAction} /> : null}
    </XStack>
  );
}
