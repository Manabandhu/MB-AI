import { brand, categoryFor, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { type FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useRedirectIfAuthenticated } from '@/lib/authStore';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';
import { GradientSurface } from '@/modules/shared/ui/GradientSurface';
import { AuroraBackground } from '@/modules/shared/ui/motion/AuroraBackground';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { Floating } from '@/modules/shared/ui/motion/Floating';
import { PressableScale } from '@/modules/shared/ui/motion/PressableScale';
import { useAppearance } from '@/theme/ThemeProvider';

type Slide = {
  key: 'rooms' | 'rides' | 'jobs' | 'community';
  icon: AppIconName;
  title: string;
  body: string;
  chips: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    key: 'rooms',
    icon: 'home',
    title: 'Find a room or roommate',
    body: 'Browse rooms and shared apartments listed by members, and message hosts directly.',
    chips: ['Shared rooms', 'Lease takeovers', 'Chat with hosts'],
  },
  {
    key: 'rides',
    icon: 'car',
    title: 'Share the ride',
    body: 'Carpool to work, the airport, or a weekend trip, and split fuel and tolls fairly.',
    chips: ['Daily commutes', 'Airport runs', 'Split costs'],
  },
  {
    key: 'jobs',
    icon: 'briefcase',
    title: 'Grow your career',
    body: 'Ask for employee referrals and discover jobs shared by people in your community.',
    chips: ['Referrals', 'Job posts', 'Visa-friendly'],
  },
  {
    key: 'community',
    icon: 'community',
    title: 'Belong, wherever you are',
    body: 'Join city groups and festivals, and get help with visas, utilities, and everyday life.',
    chips: ['City groups', 'Events', 'Visa help'],
  },
];

/** Width at which welcome switches to a two-column layout (iPad, unfolded foldables, desktop). */
const TWO_COLUMN = 820;
const onBrand = brand.color.onPrimary;
const onBrandMuted = brand.color.onPrimaryMuted;
const glass = brand.color.onPrimaryGlass;
const glassBorder = brand.color.onPrimaryHairline;

/**
 * Welcome: an immersive aurora backdrop with a swipeable story. Each slide's art drifts against the swipe
 * (parallax) and its chips float; the page dots stretch with the scroll position. Reduced motion keeps the swipe
 * but drops parallax, floating, and the aurora drift.
 */
export function WelcomeScreen() {
  useRedirectIfAuthenticated();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const twoColumn = width >= TWO_COLUMN;
  const [pageWidth, setPageWidth] = useState(width >= TWO_COLUMN ? 0 : width);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  // Leave room for the header, slide text, dots, and buttons (about 440pt plus safe areas).
  const phoneArt = Math.max(
    150,
    Math.min(width - space.x10 * 2, height - insets.top - insets.bottom - 450),
  );
  const artSize = twoColumn ? 360 : phoneArt;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const settle = (x: number) => {
    if (pageWidth) setIndex(Math.round(x / pageWidth));
  };

  const goTo = (next: number) => {
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const pager = (
    <View style={styles.pager} onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      {pageWidth > 0 ? (
        <Animated.FlatList
          ref={listRef as never}
          data={SLIDES}
          keyExtractor={(slide) => slide.key}
          horizontal
          pagingEnabled
          style={styles.list}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.x)}
          onScrollEndDrag={(event) => settle(event.nativeEvent.contentOffset.x)}
          getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
          renderItem={({ item, index: i }) => (
            <SlidePage
              artSize={artSize}
              index={i}
              pageWidth={pageWidth}
              scrollX={scrollX}
              slide={item}
            />
          )}
        />
      ) : null}
      <View
        style={styles.dots}
        accessibilityRole="adjustable"
        aria-label={`Page ${index + 1} of ${SLIDES.length}`}
      >
        {SLIDES.map((slide, i) => (
          <PageDot
            index={i}
            key={slide.key}
            label={`Show ${slide.title}`}
            onPress={() => goTo(i)}
            pageWidth={pageWidth}
            scrollX={scrollX}
            selected={i === index}
          />
        ))}
      </View>
    </View>
  );

  const actions = (
    <YStack gap="$x3" width="100%">
      <PressableScale
        aria-label="Get started"
        onPress={() => router.push('/sign-up')}
        role="button"
        style={[styles.button, styles.buttonSolid]}
      >
        <AppText color={brand.color.primaryDeep} variant="bodyStrong">
          Get started
        </AppText>
        <AppIcon color={brand.color.primaryDeep} name="chevron-right" size={18} />
      </PressableScale>
      <PressableScale
        aria-label="I already have an account"
        onPress={() => router.push('/sign-in')}
        role="button"
        style={[styles.button, styles.buttonGlass]}
      >
        <AppText color={onBrand} variant="bodyStrong">
          I already have an account
        </AppText>
      </PressableScale>
    </YStack>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuroraBackground
        colors={[
          categoryFor(SLIDES[index]?.key ?? 'rooms').from,
          brand.color.accent,
          brand.color.primaryLight,
        ]}
        height={height}
        intensity={0.6}
        width={width}
      />
      {twoColumn ? (
        <View style={[styles.wideInner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.wideIntro}>
            <Brand />
            <FadeIn>
              <AppText color={onBrand} role="heading" style={styles.headline}>
                Your community, wherever you go.
              </AppText>
            </FadeIn>
            <FadeIn index={1}>
              <AppText color={onBrandMuted} variant="lead">
                Rooms, rides, referrals, events, and everyday help from people who share your roots.
              </AppText>
            </FadeIn>
            <FadeIn index={2}>{actions}</FadeIn>
          </View>
          <View style={styles.widePager}>{pager}</View>
        </View>
      ) : (
        <>
          <View style={[styles.header, { marginTop: insets.top + space.x2 }]}>
            <Brand />
          </View>
          {pager}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.x4) }]}>
            <FadeIn index={2}>{actions}</FadeIn>
          </View>
        </>
      )}
    </View>
  );
}

function Brand() {
  return (
    <View style={styles.brand} role="heading">
      <BrandMark size={34} />
      <AppText color={onBrand} style={styles.brandName}>
        ManaBandhu
      </AppText>
    </View>
  );
}

function SlidePage({
  slide,
  index,
  pageWidth,
  artSize,
  scrollX,
}: {
  slide: Slide;
  index: number;
  pageWidth: number;
  artSize: number;
  scrollX: SharedValue<number>;
}) {
  const { reduceMotion } = useAppearance();
  const art = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const offset = scrollX.value / pageWidth - index;
    return {
      transform: [
        { translateX: offset * pageWidth * 0.35 },
        { rotate: `${offset * -8}deg` },
        { scale: interpolate(Math.abs(offset), [0, 1], [1, 0.82]) },
      ],
      opacity: interpolate(Math.abs(offset), [0, 0.8], [1, 0.3]),
    };
  });
  const copy = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const offset = scrollX.value / pageWidth - index;
    return {
      transform: [{ translateX: offset * pageWidth * 0.15 }],
      opacity: interpolate(Math.abs(offset), [0, 0.6], [1, 0]),
    };
  });
  return (
    <View style={[styles.page, { width: pageWidth }]} aria-label={`${slide.title}. ${slide.body}`}>
      <Animated.View style={art}>
        <SlideArt size={artSize} slide={slide} />
      </Animated.View>
      <Animated.View style={[styles.copy, copy]}>
        <AppText center color={onBrand} style={styles.slideTitle}>
          {slide.title}
        </AppText>
        <AppText center color={onBrandMuted} style={styles.slideBody}>
          {slide.body}
        </AppText>
      </Animated.View>
    </View>
  );
}

function SlideArt({ slide, size }: { slide: Slide; size: number }) {
  const colors = categoryFor(slide.key);
  const icon = size * 0.34;
  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <View
        style={[
          styles.artGlow,
          { width: size, height: size, borderRadius: size * 0.22, shadowColor: colors.from },
        ]}
      >
        <GradientSurface colors={[colors.from, colors.to]} padding={0} radius={size * 0.22}>
          <View style={[styles.artInner, { width: size, height: size }]}>
            <View
              style={[
                styles.artRing,
                { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39 },
              ]}
            />
            <View
              style={[
                styles.artRing,
                { width: size * 0.52, height: size * 0.52, borderRadius: size * 0.26 },
              ]}
            />
            <View
              style={[
                styles.artIcon,
                { width: icon * 1.6, height: icon * 1.6, borderRadius: icon * 0.5 },
              ]}
            >
              <AppIcon color={onBrand} name={slide.icon} size={icon * 0.8} strokeWidth={1.7} />
            </View>
          </View>
        </GradientSurface>
      </View>
      <Floating delay={0} style={[styles.chipWrap, { top: '6%', left: 0 }]}>
        <Chip label={slide.chips[0]} />
      </Floating>
      <Floating delay={600} style={[styles.chipWrap, { top: '40%', right: 0 }]}>
        <Chip label={slide.chips[1]} />
      </Floating>
      <Floating delay={1200} style={[styles.chipWrap, { bottom: '6%', left: '8%' }]}>
        <Chip label={slide.chips[2]} />
      </Floating>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <AppText color={onBrand} fontSize={13} fontWeight="700">
        {label}
      </AppText>
    </View>
  );
}

function PageDot({
  index,
  selected,
  label,
  onPress,
  scrollX,
  pageWidth,
}: {
  index: number;
  selected: boolean;
  label: string;
  onPress: () => void;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const style = useAnimatedStyle(() => {
    const active = pageWidth ? Math.max(0, 1 - Math.abs(scrollX.value / pageWidth - index)) : 0;
    return {
      width: 8 + active * 20,
      opacity: 0.4 + active * 0.6,
    };
  });
  return (
    <PressableScale
      aria-label={label}
      aria-selected={selected}
      haptic="selection"
      onPress={onPress}
      role="tab"
      style={styles.dotTarget}
    >
      <Animated.View style={[styles.dot, style]} />
    </PressableScale>
  );
}

// Layout for the animated welcome layers (allowed by the design-system skill); colours come from `brand` tokens.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.gradient[2] },
  header: { paddingHorizontal: space.x6, height: 44, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  brandName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  pager: { flex: 1, justifyContent: 'center' },
  list: { flexGrow: 0 },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.x6,
    // Keeps each slide's parallax art inside its own page.
    overflow: 'hidden',
    paddingVertical: space.x4,
  },
  artGlow: {
    shadowOpacity: 0.55,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 16,
  },
  artInner: { alignItems: 'center', justifyContent: 'center' },
  artRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: glassBorder,
    backgroundColor: brand.color.onPrimaryVeil,
  },
  artIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass,
    borderWidth: 1,
    borderColor: glassBorder,
  },
  chipWrap: { position: 'absolute' },
  chip: {
    backgroundColor: glass,
    borderColor: glassBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copy: { alignItems: 'center' },
  slideTitle: {
    marginTop: space.x8,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  slideBody: { marginTop: space.x2, maxWidth: 360, fontSize: 17, lineHeight: 25 },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: space.x1 },
  dotTarget: { minWidth: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: brand.color.onPrimary },
  footer: { paddingHorizontal: space.x6, paddingTop: space.x2 },
  button: {
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    paddingHorizontal: space.x6,
  },
  buttonSolid: {
    backgroundColor: brand.color.onPrimary,
    shadowColor: brand.color.accent,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  buttonGlass: { backgroundColor: glass, borderWidth: 1, borderColor: glassBorder },
  wideInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1120,
    paddingHorizontal: space.x10,
    gap: space.x10,
  },
  wideIntro: { flex: 1, maxWidth: 460, gap: space.x5 },
  widePager: { flex: 1, minHeight: 560 },
  headline: { fontSize: 48, lineHeight: 54, fontWeight: '900', letterSpacing: -1.5 },
});
