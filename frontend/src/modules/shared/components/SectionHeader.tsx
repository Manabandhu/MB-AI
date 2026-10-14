import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Legacy section heading (eyebrow, `h3` title, caption, optional link-style action) on theme tokens. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <XStack alignItems="center" gap="$x4" justifyContent="space-between">
      <YStack flex={1} gap="$x1">
        {eyebrow ? (
          <AppText tone="teal" variant="overline">
            {eyebrow}
          </AppText>
        ) : null}
        <Heading variant="h3">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} size="sm" variant="ghost" />
      ) : null}
    </XStack>
  );
}
