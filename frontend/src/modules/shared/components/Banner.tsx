import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';
export type BannerProps = {
  title: string;
  body?: string;
  variant?: BannerVariant;
  onDismiss?: () => void;
  icon?: ReactNode;
};
const backgrounds = {
  info: '$infoBg',
  warning: '$warmBg',
  error: '$errorBg',
  success: '$successBg',
} as const;
export function Banner({ title, body, variant = 'info', onDismiss, icon }: BannerProps) {
  return (
    <XStack
      role={variant === 'error' ? 'alert' : 'status'}
      backgroundColor={backgrounds[variant]}
      borderRadius="$control"
      gap="$x3"
      padding="$x4"
      alignItems="flex-start"
    >
      {icon}
      <YStack flex={1} minWidth={0} gap="$x1">
        <AppText variant="bodyStrong">{title}</AppText>
        {body ? <AppText>{body}</AppText> : null}
      </YStack>
      {onDismiss ? (
        <IconButton label={`Dismiss ${title}`} icon="close" variant="plain" onPress={onDismiss} />
      ) : null}
    </XStack>
  );
}
