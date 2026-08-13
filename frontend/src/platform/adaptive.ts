import { breakpoint, contentWidth } from '@manabandhu/design-system';
import { useWindowDimensions } from 'react-native';

export type WindowClass = 'compact' | 'medium' | 'expanded' | 'wide';

export function useAdaptiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const windowClass: WindowClass =
    width >= breakpoint.wide
      ? 'wide'
      : width >= breakpoint.expanded
        ? 'expanded'
        : width >= breakpoint.medium
          ? 'medium'
          : 'compact';

  const isLandscape = width > height;
  const isFoldableLike = width >= 700 && width / Math.max(height, 1) < 1.15;
  const columns = windowClass === 'compact' ? 1 : windowClass === 'medium' ? 2 : 3;
  const maxContentWidth =
    windowClass === 'compact'
      ? contentWidth.compact
      : windowClass === 'medium'
        ? contentWidth.medium
        : contentWidth.expanded;

  return {
    columns,
    fontScale,
    height,
    isFoldableLike,
    isLandscape,
    maxContentWidth,
    width,
    windowClass,
  } as const;
}
