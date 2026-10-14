import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

export type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  /** A second, quieter next step (rendered as a ghost button after the main action). */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Custom illustration; defaults to an icon in a tinted circle. */
  icon?: ReactNode;
  iconName?: AppIconName;
  /** Smaller padding for use inside cards and widgets. */
  compact?: boolean;
};

/** Honest "nothing here yet" state with one clear next step. Never fill an empty list with sample data. */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
  iconName = 'sparks',
  compact,
}: EmptyStateProps) {
  const { palette } = useAppearance();
  return (
    <YStack alignItems="center" gap="$x3" padding={compact ? '$x4' : '$x8'}>
      {icon ?? (
        <YStack
          alignItems="center"
          backgroundColor="$surfaceContainerLow"
          borderRadius="$card"
          height={compact ? 48 : 72}
          justifyContent="center"
          width={compact ? 48 : 72}
        >
          <AppIcon color={palette.ink} name={iconName} size={compact ? 22 : 28} />
        </YStack>
      )}
      <AppText center variant={compact ? 'bodyStrong' : 'h3'}>
        {title}
      </AppText>
      <AppText center maxWidth={420} tone="muted">
        {body}
      </AppText>
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <XStack flexWrap="wrap" gap="$x2" justifyContent="center">
          {actionLabel && onAction ? (
            <AppButton
              label={actionLabel}
              onPress={onAction}
              size={compact ? 'sm' : 'md'}
              variant="secondary"
            />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <AppButton
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              size={compact ? 'sm' : 'md'}
              variant="ghost"
            />
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  );
}
