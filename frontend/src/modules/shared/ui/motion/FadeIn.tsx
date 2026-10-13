import { motion, spring } from '@manabandhu/design-system';
import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppearance } from '@/theme/ThemeProvider';

type FadeInProps = {
  children: ReactNode;
  /** Position in a list; each step adds `motion.staggerMs` of delay (capped so long lists stay snappy). */
  index?: number;
  delay?: number;
  /**
   * `false` mounts the child without the entrance. Lists that re-render as you type or filter pass `false` after
   * their first paint, so newly shown items do not replay the animation on every keystroke.
   */
  animate?: boolean;
};

/** Entrance animation for sections and list items (rises and fades in on the UI thread). Static with reduced motion. */
export function FadeIn({ children, index = 0, delay = 0, animate = true }: FadeInProps) {
  const { reduceMotion } = useAppearance();
  if (reduceMotion) return <>{children}</>;
  // Keep the same wrapper either way so toggling `animate` never remounts the child.
  if (!animate) return <Animated.View>{children}</Animated.View>;
  const entering = FadeInDown.delay(delay + Math.min(index, 3) * motion.staggerMs)
    .springify()
    .damping(spring.gentle.damping)
    .stiffness(spring.gentle.stiffness)
    .mass(spring.gentle.mass);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}
