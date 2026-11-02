import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { SkeletonCard } from '@/modules/shared/ui/Skeleton';
import { useAppearance } from '@/theme/ThemeProvider';

export type LoadingStateVariant = 'spinner' | 'skeleton';

export type LoadingStateProps = {
  variant?: LoadingStateVariant;
  count?: number;
  label?: string;
};

/** Spinner for whole screens; skeleton cards for lists so the layout does not jump when data arrives. */
export function LoadingState({
  variant = 'spinner',
  count = 3,
  label = 'Loading…',
}: LoadingStateProps) {
  const { palette } = useAppearance();
  if (variant === 'skeleton') {
    return (
      <YStack aria-label={label} gap="$x3">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </YStack>
    );
  }
  return (
    <YStack aria-label={label} role="progressbar" alignItems="center" gap="$x3" padding="$x8">
      <ActivityIndicator color={palette.primary} size="large" />
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
    </YStack>
  );
}
