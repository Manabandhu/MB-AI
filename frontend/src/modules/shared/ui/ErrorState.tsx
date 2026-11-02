import type { ReactNode } from 'react';
import { YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

export type ErrorStateProps = {
  title: string;
  body: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  compact?: boolean;
  /** Icon on the action button. Defaults to `refresh`; pass another (or `null`) when the action navigates. */
  actionIcon?: AppIconName | null;
};

/** Shown when a request failed. Offers a retry (or another way forward) and never pretends the request succeeded. */
export function ErrorState({
  title,
  body,
  retryLabel = 'Try again',
  onRetry,
  icon,
  compact,
  actionIcon = 'refresh',
}: ErrorStateProps) {
  const { palette } = useAppearance();
  return (
    <YStack aria-live="polite" alignItems="center" gap="$x3" padding={compact ? '$x4' : '$x8'}>
      {icon ?? (
        <YStack
          alignItems="center"
          backgroundColor="$warmTint"
          borderRadius="$pill"
          height={compact ? 48 : 72}
          justifyContent="center"
          width={compact ? 48 : 72}
        >
          <AppIcon color={palette.warm} name="warning" size={compact ? 22 : 32} />
        </YStack>
      )}
      <AppText center variant={compact ? 'bodyStrong' : 'h3'}>
        {title}
      </AppText>
      <AppText center maxWidth={420} tone="muted">
        {body}
      </AppText>
      {onRetry ? (
        <AppButton
          icon={actionIcon ?? undefined}
          label={retryLabel}
          onPress={onRetry}
          size={compact ? 'sm' : 'md'}
          variant="secondary"
        />
      ) : null}
    </YStack>
  );
}
