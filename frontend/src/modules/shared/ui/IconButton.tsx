import type { ReactNode } from 'react';
import { useTheme, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

type IconButtonProps = {
  icon: AppIconName;
  /** Required: icon-only controls must be named for screen readers. */
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'tinted' | 'solid';
  size?: number;
  /** Optional overlay such as an unread dot. */
  badge?: ReactNode;
};

/** 44pt minimum touch target around a single icon. */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'tinted',
  size = 20,
  badge,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <YStack
      aria-label={label}
      role="button"
      alignItems="center"
      backgroundColor={
        variant === 'solid' ? '$primary' : variant === 'tinted' ? '$primaryTint' : 'transparent'
      }
      borderRadius="$pill"
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      height="$touch"
      hoverStyle={{
        backgroundColor: variant === 'solid' ? '$primaryContainer' : '$surfaceContainer',
      }}
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      width="$touch"
    >
      <AppIcon
        color={variant === 'solid' ? theme.onPrimary?.val : theme.primary?.val}
        name={icon}
        size={size}
      />
      {badge}
    </YStack>
  );
}
