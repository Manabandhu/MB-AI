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
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <XStack alignItems="center" flexWrap="wrap" gap="$x3" paddingVertical="$x2">
      <YStack flex={1} minWidth={160} gap="$x1">
        {eyebrow ? (
          <AppText tone="primary" variant="overline">
            {eyebrow}
          </AppText>
        ) : null}
        <Heading variant="h2">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>
      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="ghost"
          size="sm"
          iconAfter="arrow-right"
        />
      ) : null}
    </XStack>
  );
}
