import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { YStack } from 'tamagui';
import { useAppearance } from '@/theme/ThemeProvider';

type SkeletonProps = { width?: DimensionValue; height?: number; radius?: number; circle?: boolean };

/** Placeholder block shown while real data loads. Pulses on the UI thread; static with reduced motion. */
export function Skeleton({ width = '100%', height = 16, radius = 8, circle }: SkeletonProps) {
  const { reduceMotion, palette } = useAppearance();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const size = circle ? height : undefined;
  return (
    <Animated.View
      aria-hidden
      style={[
        {
          width: size ?? width,
          height,
          borderRadius: circle ? height / 2 : radius,
          backgroundColor: palette.skeleton,
        },
        style,
      ]}
    />
  );
}

/** A card-shaped group of skeleton lines, used by list and widget loading states. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <YStack
      aria-label="Loading"
      role="progressbar"
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderRadius="$card"
      borderWidth={1}
      gap="$x2"
      padding="$x4"
    >
      <Skeleton height={18} width="60%" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Skeleton height={12} key={i} width={i === lines - 2 ? '40%' : '90%'} />
      ))}
    </YStack>
  );
}
