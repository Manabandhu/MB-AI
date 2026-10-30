import { brand, spring } from '@manabandhu/design-system';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppearance } from '@/theme/ThemeProvider';

/**
 * The brand mark with an entrance: the tile springs in, the saffron "friend" dot drops into place, then the whole
 * mark floats gently. Static (no movement) when reduced motion is on.
 */
export function AnimatedBrandMark({
  size = 120,
  float = true,
}: {
  size?: number;
  float?: boolean;
}) {
  const { reduceMotion, richMotion } = useAppearance();
  const tile = useSharedValue(reduceMotion ? 1 : 0.6);
  const tileOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const dot = useSharedValue(reduceMotion ? 0 : -size * 0.6);
  const hover = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    tileOpacity.value = withTiming(1, { duration: 260 });
    tile.value = withSpring(1, spring.bouncy);
    dot.value = withDelay(260, withSpring(0, { ...spring.bouncy, damping: 8 }));
    if (float && richMotion) {
      hover.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
        ),
      );
    }
  }, [dot, float, hover, reduceMotion, richMotion, tile, tileOpacity]);

  const tileStyle = useAnimatedStyle(() => ({
    opacity: tileOpacity.value,
    transform: [{ translateY: hover.value }, { scale: tile.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dot.value }] }));
  const [start, mid, end] = brand.gradient;
  const dotSize = size * 0.121;

  return (
    <Animated.View
      aria-label={brand.name}
      role="img"
      style={[{ width: size, height: size }, tileStyle]}
    >
      <Svg height={size} viewBox="0 0 1024 1024" width={size}>
        <Defs>
          <LinearGradient id="mbAnimTile" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={start} />
            <Stop offset="0.45" stopColor={mid} />
            <Stop offset="1" stopColor={end} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#mbAnimTile)" height={1024} rx={232} width={1024} />
        <Path
          d="M276 744V518a118 118 0 0 1 236 0v226M512 744V518a118 118 0 0 1 236 0v226"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={96}
        />
      </Svg>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: size / 2 - dotSize / 2,
            top: size * (280 / 1024) - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: brand.color.accent,
          },
          dotStyle,
        ]}
      />
    </Animated.View>
  );
}
