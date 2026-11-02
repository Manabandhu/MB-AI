import { motion, space, spring } from '@manabandhu/design-system';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppearance } from '@/theme/ThemeProvider';

type PromoCarouselProps<T> = {
  items: readonly T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Accessible name for the carousel region. */
  label: string;
  /** Share of the width each slide takes; the rest lets the next slide peek in. Defaults by window width. */
  slideRatio?: number;
  /** Auto-advance (only with rich motion; pauses while the member is dragging). */
  autoPlay?: boolean;
};

function Dot({
  index,
  progress,
  color,
  idle,
}: {
  index: number;
  progress: SharedValue<number>;
  color: string;
  idle: string;
}) {
  const style = useAnimatedStyle(() => {
    const active = Math.max(0, 1 - Math.abs(progress.value - index));
    return {
      width: interpolate(active, [0, 1], [6, 22]),
      opacity: interpolate(active, [0, 1], [0.45, 1]),
      backgroundColor: active > 0.5 ? color : idle,
    };
  });
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />;
}

/**
 * Horizontally snapping banner carousel with a peeking next slide, scroll-linked page dots, and optional
 * auto-advance. Slides are whatever `renderItem` returns (promos, featured listings); it never invents content.
 */
export function PromoCarousel<T>({
  items,
  keyOf,
  renderItem,
  label,
  slideRatio,
  autoPlay = true,
}: PromoCarouselProps<T>) {
  const { palette, richMotion } = useAppearance();
  const [width, setWidth] = useState(0);
  const ref = useAnimatedRef<Animated.ScrollView>();
  const progress = useSharedValue(0);
  const dragging = useRef(false);
  const page = useRef(0);
  const ratio = slideRatio ?? (width >= 1000 ? 0.48 : width >= 600 ? 0.7 : 0.86);
  const slide = Math.round(width * (items.length > 1 ? ratio : 1));
  const step = slide + space.x3;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (step > 0) progress.value = event.contentOffset.x / step;
    },
  });

  useEffect(() => {
    if (!autoPlay || !richMotion || items.length < 2 || step <= 0) return;
    const timer = setInterval(() => {
      if (dragging.current) return;
      page.current = (page.current + 1) % items.length;
      ref.current?.scrollTo({ x: page.current * step, animated: true });
    }, motion.carouselMs);
    return () => clearInterval(timer);
  }, [autoPlay, items.length, ref, richMotion, step]);

  // Snap the dots back exactly when the list shrinks.
  useEffect(() => {
    progress.value = withSpring(Math.min(page.current, items.length - 1), spring.glide);
  }, [items.length, progress]);

  if (items.length === 0) return null;
  return (
    <View
      aria-label={label}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      role="region"
    >
      {width > 0 ? (
        <Animated.ScrollView
          contentContainerStyle={{ gap: space.x3 }}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={(event) => {
            page.current = Math.round(event.nativeEvent.contentOffset.x / step);
          }}
          onScroll={onScroll}
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onScrollEndDrag={() => {
            dragging.current = false;
          }}
          ref={ref}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          style={{ overflow: 'visible' }}
        >
          {items.map((item, index) => (
            <View key={keyOf(item)} style={{ width: slide }}>
              {renderItem(item, index)}
            </View>
          ))}
        </Animated.ScrollView>
      ) : null}
      {items.length > 1 ? (
        <View
          aria-hidden
          style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: space.x3 }}
        >
          {items.map((item, index) => (
            <Dot
              color={palette.primary}
              idle={palette.muted}
              index={index}
              key={keyOf(item)}
              progress={progress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
