import type { ReactNode } from 'react';
import { useTheme, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';

type IconButtonProps = {
  icon: AppIconName;
  /** Required: icon-only controls must be named for screen readers. */
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'tinted' | 'solid';
  size?: number;
  /** Optional overlay such as an unread dot. */
  badge?: ReactNode;
  /** Dims the control, removes it from the focus order, and ignores presses. */
  disabled?: boolean;
};

/** 44pt minimum touch target around a single icon. */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'tinted',
  size = 20,
  badge,
  disabled,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <YStack
      aria-label={label}
      role="button"
      aria-disabled={disabled || undefined}
      alignItems="center"
      backgroundColor={
        variant === 'solid' ? '$primary' : variant === 'tinted' ? '$primaryTint' : 'transparent'
      }
      borderRadius="$pill"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable={!disabled}
      height="$touch"
      hoverStyle={
        disabled
          ? undefined
          : { backgroundColor: variant === 'solid' ? '$primary' : '$surfaceContainer' }
      }
      justifyContent="center"
      onPress={disabled ? undefined : onPress}
      {...keyboardPress(onPress, !disabled)}
      opacity={disabled ? 0.4 : 1}
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      // Positioned so a `badge` overlay anchors to this button (web stacks are static by default).
      position="relative"
      width="$touch"
    >
      <AppIcon
        color={variant === 'solid' ? theme.onPrimary?.get() : theme.primary?.get()}
        name={icon}
        size={size}
      />
      {badge}
    </YStack>
  );
}
