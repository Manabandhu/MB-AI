import { AnimatedBrandMark } from '@/modules/shared/ui/motion/AnimatedBrandMark';

/**
 * Native: the animated 2D mark. The WebGL scene ships on web first (`BrandHero3D.web.tsx`); a native `expo-gl`
 * version is a follow-up that must be verified on devices before it replaces this.
 */
export function BrandHero3D({ size = 220 }: { size?: number }) {
  return <AnimatedBrandMark size={size * 0.6} />;
}
