import { lazy, Suspense, useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { AnimatedBrandMark } from '@/modules/shared/ui/motion/AnimatedBrandMark';
import { useAppearance } from '@/theme/ThemeProvider';

// three.js is only downloaded when a hero is actually shown, never on the critical path.
const BrandScene = lazy(() => import('./BrandScene.web'));

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** 3D brand scene on capable browsers; the animated 2D mark while loading, without WebGL, or with reduced motion. */
export function BrandHero3D({ size = 220 }: { size?: number }) {
  const { richMotion } = useAppearance();
  const [canRender, setCanRender] = useState(false);
  useEffect(() => {
    setCanRender(richMotion && supportsWebGL());
  }, [richMotion]);

  const fallback = (
    <YStack alignItems="center" height={size} justifyContent="center" width={size}>
      <AnimatedBrandMark size={size * 0.6} />
    </YStack>
  );
  if (!canRender) return fallback;
  return (
    <Suspense fallback={fallback}>
      <YStack aria-label="ManaBandhu" height={size} role="img" width={size}>
        <BrandScene />
      </YStack>
    </Suspense>
  );
}
