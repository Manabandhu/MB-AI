import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export type BannerProps = {
  title: string;
  body?: string;
  variant?: BannerVariant;
  onDismiss?: () => void;
  icon?: React.ReactNode;
};

/** Pastel background and accent border per variant; text stays in the body colour for AA contrast. */
const variantTokens = {
  info: { bg: '$infoBg', border: '$info' },
  warning: { bg: '$goldBg', border: '$warning' },
  error: { bg: '$errorBg', border: '$error' },
  success: { bg: '$successBg', border: '$success' },
} as const;

export function Banner({ title, body, variant = 'info', onDismiss, icon }: BannerProps) {
  const t = variantTokens[variant];
  return (
    <XStack
      backgroundColor={t.bg}
      borderColor={t.border}
      borderRadius="$control"
      borderWidth={1}
      gap="$x3"
      padding="$x4"
      role={variant === 'error' || variant === 'warning' ? 'alert' : undefined}
    >
      {icon ? <YStack marginTop="$x1">{icon}</YStack> : null}
      <YStack flex={1} gap="$x1">
        <AppText variant="bodyStrong">{title}</AppText>
        {body ? <AppText>{body}</AppText> : null}
      </YStack>
      {onDismiss ? (
        <IconButton icon="close" label="Dismiss" onPress={onDismiss} variant="plain" />
      ) : null}
    </XStack>
  );
}
