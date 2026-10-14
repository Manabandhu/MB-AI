import { spring } from '@manabandhu/design-system';
import { createAnimations } from '@tamagui/animations-reanimated';

// Native: Reanimated springs on the UI thread, tuned from the design-system `spring` presets.
export const animations = createAnimations({
  quick: { type: 'spring', ...spring.snappy },
  gentle: { type: 'spring', ...spring.gentle },
  bouncy: { type: 'spring', ...spring.bouncy },
  fast: { type: 'timing', duration: 120 },
  normal: { type: 'timing', duration: 220 },
  slow: { type: 'timing', duration: 320 },
});
