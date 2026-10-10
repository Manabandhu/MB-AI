import { brand } from '@manabandhu/design-system';
import { type ReactNode, useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { YStack } from 'tamagui';

type GradientSurfaceProps = {
  children: ReactNode;
  radius?: number;
  padding?: number;
  /** Override the brand gradient stops (top-left → bottom-right). */
  colors?: readonly string[];
};

/** Brand-gradient panel (hero banners, promos). Drawn with SVG so it renders the same on iOS, Android, and web. */
export function GradientSurface({
  children,
  radius = 24,
  padding = 20,
  colors = brand.gradient,
}: GradientSurfaceProps) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <YStack borderRadius={radius} overflow="hidden" padding={padding}>
      <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            {colors.map((stop, index) => (
              <Stop key={stop} offset={index / Math.max(1, colors.length - 1)} stopColor={stop} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${id})`} height="100%" rx={radius} ry={radius} width="100%" />
      </Svg>
      {/* Positioned so content paints above the absolutely positioned gradient on web. */}
      <YStack position="relative" zIndex={1}>
        {children}
      </YStack>
    </YStack>
  );
}
