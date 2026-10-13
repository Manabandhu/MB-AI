import { breakpoint, contentWidth } from '@manabandhu/design-system';
import { useWindowDimensions } from './windowDimensions';

export type WindowClass = 'compact' | 'medium' | 'expanded' | 'wide';

/** Window-size facts every screen should branch on (never on device model). */
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

  const isDualPane = width >= breakpoint.expanded;

  return {
    columns,
    fontScale,
    height,
    isDualPane,
    isFoldableLike,
    isLandscape,
    maxContentWidth,
    width,
    windowClass,
  } as const;
}

/** True at the expanded breakpoint (1024pt) and wider: desktop web, landscape tablets, unfolded foldables. */
export function useIsDesktopLayout() {
  const { windowClass } = useAdaptiveLayout();
  return windowClass === 'expanded' || windowClass === 'wide';
}
