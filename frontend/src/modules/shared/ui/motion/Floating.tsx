import { motion } from '@manabandhu/design-system';
import { type ReactNode, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppearance } from '@/theme/ThemeProvider';

type FloatingProps = {
  children: ReactNode;
  /** Vertical travel in points. */
  distance?: number;
  /** Start offset so neighbouring items float out of step. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Decorative float loop (chips and badges on hero art). Only moves with rich motion; otherwise renders still. */
export function Floating({ children, distance = 6, delay = 0, style }: FloatingProps) {
  const { richMotion } = useAppearance();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!richMotion) return;
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-distance, { duration: motion.floatMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(y);
  }, [delay, distance, richMotion, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
