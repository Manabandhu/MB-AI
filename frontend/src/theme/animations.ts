import { createAnimations } from '@tamagui/animations-css';

// Web: CSS transitions run on the compositor and add no JS work per frame. Native uses Reanimated
// (`animations.native.ts`). Keys and feel must match across both files.
export const animations = createAnimations({
  quick: 'cubic-bezier(0.2, 0.9, 0.3, 1.2) 180ms',
  gentle: 'cubic-bezier(0.2, 0.8, 0.2, 1) 320ms',
  bouncy: 'cubic-bezier(0.3, 1.6, 0.5, 1) 420ms',
  fast: 'ease-out 120ms',
  normal: 'ease-in-out 220ms',
  slow: 'ease-in-out 320ms',
});
