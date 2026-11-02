import { aurora, motion } from '@manabandhu/design-system';
import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAppearance } from '@/theme/ThemeProvider';

type Blob = {
  color: string;
  /** Size relative to the container's longer side. */
  size: number;
  /** Resting position (fraction of width/height, blob centre). */
  x: number;
  y: number;
  /** Drift distance in points and phase offset (0–1). */
  drift: number;
  phase: number;
};

const DEFAULT_BLOBS: Blob[] = [
  { color: aurora.violet, size: 1.1, x: 0.15, y: 0.1, drift: 28, phase: 0 },
  { color: aurora.saffron, size: 0.75, x: 0.95, y: 0.2, drift: 36, phase: 0.33 },
  { color: aurora.pink, size: 0.8, x: 0.55, y: 1, drift: 30, phase: 0.66 },
];

type AuroraBackgroundProps = {
  width: number;
  height: number;
  /** Override the glowing blob hues (up to three). */
  colors?: readonly string[];
  /** Base gradient behind the blobs (top → bottom). */
  base?: readonly string[];
  /** Blob opacity at the centre. */
  intensity?: number;
};

function AuroraBlob({
  blob,
  width,
  height,
  intensity,
  animate,
}: {
  blob: Blob;
  width: number;
  height: number;
  intensity: number;
  animate: boolean;
}) {
  const id = `a${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const t = useSharedValue(blob.phase);
  useEffect(() => {
    if (!animate) return;
    t.value = withRepeat(
      withTiming(blob.phase + 1, { duration: motion.auroraMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(t);
  }, [animate, blob.phase, t]);
  const style = useAnimatedStyle(() => {
    const angle = t.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.cos(angle) * blob.drift },
        { translateY: Math.sin(angle) * blob.drift * 0.7 },
        { scale: 1 + Math.sin(angle) * 0.06 },
      ],
    };
  });
  const size = Math.max(width, height) * blob.size;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          left: width * blob.x - size / 2,
          top: height * blob.y - size / 2,
        },
        style,
      ]}
    >
      <Svg height={size} width={size}>
        <Defs>
          <RadialGradient cx="50%" cy="50%" id={id} r="50%">
            <Stop offset="0" stopColor={blob.color} stopOpacity={intensity} />
            <Stop offset="0.55" stopColor={blob.color} stopOpacity={intensity * 0.35} />
            <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect fill={`url(#${id})`} height={size} width={size} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Deep gradient with soft glowing colour blobs that slowly drift (CRED-style ambient backdrop). Pure SVG plus
 * Reanimated transforms, so it costs no extra libraries on any platform. The drift only runs with rich motion; with
 * reduced motion the blobs stay still. Decorative: hidden from assistive tech and never intercepts touches.
 */
export function AuroraBackground({
  width,
  height,
  colors,
  base = aurora.base,
  intensity = 0.55,
}: AuroraBackgroundProps) {
  const { richMotion } = useAppearance();
  const baseId = `b${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const blobs = colors
    ? DEFAULT_BLOBS.map((blob, i) => ({ ...blob, color: colors[i % colors.length] ?? blob.color }))
    : DEFAULT_BLOBS;
  if (width <= 0 || height <= 0) return null;
  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id={baseId} x1="0" x2="0.4" y1="0" y2="1">
            {base.map((stop, index) => (
              <Stop key={stop} offset={index / Math.max(1, base.length - 1)} stopColor={stop} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${baseId})`} height="100%" width="100%" />
      </Svg>
      {blobs.map((blob) => (
        <AuroraBlob
          animate={richMotion}
          blob={blob}
          height={height}
          intensity={intensity}
          key={`${blob.x}-${blob.y}`}
          width={width}
        />
      ))}
    </View>
  );
}
