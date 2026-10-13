import { color, palette, radius, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { AuthButton } from '@/modules/auth/components/AuthKit';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';
import { DiscoveryArtwork, discoveryKind } from '@/modules/shared/ui/DiscoveryArtwork';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useWindowDimensions } from '@/platform/windowDimensions';

type Slide = {
  key: string;
  icon: AppIconName;
  title: string;
  body: string;
  tint: string;
  accent: string;
  chips: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    key: 'rooms',
    icon: 'home',
    title: 'Find a room or roommate',
    body: 'Browse rooms and shared apartments listed by members, and message hosts directly.',
    tint: palette.artViolet,
    accent: color.primary,
    chips: ['Shared rooms', 'Lease takeovers', 'Chat with hosts'],
  },
  {
    key: 'rides',
    icon: 'car',
    title: 'Share the ride',
    body: 'Carpool to work, the airport, or a weekend trip, and split fuel and tolls fairly.',
    tint: palette.artMint,
    accent: color.teal,
    chips: ['Daily commutes', 'Airport runs', 'Split costs'],
  },
  {
    key: 'careers',
    icon: 'briefcase',
    title: 'Grow your career',
    body: 'Ask for employee referrals and discover jobs shared by people in your community.',
    tint: palette.artPeach,
    accent: color.warm,
    chips: ['Referrals', 'Job posts', 'Visa-friendly'],
  },
  {
    key: 'community',
    icon: 'community',
    title: 'Belong, wherever you are',
    body: 'Join city groups and festivals, and get help with visas, utilities, and everyday life.',
    tint: palette.artViolet,
    accent: color.primary,
    chips: ['City groups', 'Events', 'Visa help'],
  },
];

/** Width at which welcome switches to a two-column layout (iPad, unfolded foldables, desktop). */
const TWO_COLUMN = 820;

export function WelcomeScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  useRedirectIfAuthenticated();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const twoColumn = width >= TWO_COLUMN;
  // Phones know the page width up front, so slides render on the first frame instead of after a layout pass.
  const [pageWidth, setPageWidth] = useState(width >= TWO_COLUMN ? 0 : width);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  // Size the artwork from the height left after the header, slide text, dots, and buttons (about 440pt plus the
  // safe areas), so the copy is never clipped on an iPhone SE and the art fills taller phones.
  const phoneArt = Math.max(
    150,
    Math.min(width - space.x6 * 2, height - insets.top - insets.bottom - 440),
  );
  const artSize = twoColumn ? 360 : phoneArt;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  const goTo = (next: number) => {
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const pager = (
    <View style={styles.pager} onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      {pageWidth > 0 ? (
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(slide) => slide.key}
          horizontal
          pagingEnabled
          style={styles.list}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
          getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
          renderItem={({ item }) => (
            <View
              style={[styles.page, { width: pageWidth }]}
              aria-label={`${item.title}. ${item.body}`}
            >
              <SlideArt slide={item} size={artSize} />
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideBody}>{item.body}</Text>
            </View>
          )}
        />
      ) : null}
      <View
        style={styles.dots}
        accessibilityRole="adjustable"
        aria-label={`Page ${index + 1} of ${SLIDES.length}`}
      >
        {SLIDES.map((slide, i) => (
          <Pressable
            key={slide.key}
            role="button"
            aria-label={`Show ${slide.title}`}
            hitSlop={10}
            onPress={() => goTo(i)}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );

  const actions = (
    <View style={styles.actions}>
      <AuthButton label="Get started" onPress={() => router.push('/sign-up')} />
      <AuthButton
        label="I already have an account"
        variant="secondary"
        onPress={() => router.push('/sign-in')}
      />
    </View>
  );

  if (twoColumn) {
    return (
      <View
        style={[
          styles.root,
          styles.rootWide,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.wideInner}>
          <View style={styles.wideIntro}>
            <Brand />
            <Text role="heading" style={styles.headline}>
              Your community, wherever you go.
            </Text>
            <Text style={styles.lead}>
              Rooms, rides, referrals, events, and everyday help from people who share your roots.
            </Text>
            {actions}
          </View>
          <View style={styles.widePager}>{pager}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.x2 }]}>
      <View style={styles.header}>
        <Brand />
      </View>
      {pager}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.x4) }]}>
        {actions}
      </View>
    </View>
  );
}

function Brand() {
  const { styles } = useScreenStyles(createScreenStyles);
  return (
    <View style={styles.brand} role="heading">
      <BrandMark size={32} />
      <Text style={styles.brandName}>ManaBandhu</Text>
    </View>
  );
}

function SlideArt({ slide, size }: { slide: Slide; size: number }) {
  const { styles } = useScreenStyles(createScreenStyles);
  return (
    <View
      style={[styles.art, { width: size, height: size, backgroundColor: slide.tint }]}
      aria-hidden
    >
      <DiscoveryArtwork
        kind={discoveryKind(slide.key === 'careers' ? 'jobs' : slide.key)}
        height={size * 0.85}
      />
    </View>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.surface },
    rootWide: { backgroundColor: palette.background, justifyContent: 'center' },
    header: { paddingHorizontal: space.x6, height: 44, justifyContent: 'center' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
    brandName: { color: palette.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
    pager: { flex: 1, justifyContent: 'center' },
    // Size the list to its slides so the art, copy, and dots stay grouped in the middle of tall phones.
    list: { flexGrow: 0 },
    page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.x6 },
    art: {
      borderRadius: radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    artHalo: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.45)' },
    artIcon: {
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.ink,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    chip: {
      position: 'absolute',
      backgroundColor: palette.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      shadowColor: palette.ink,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    chipTopLeft: { top: '9%', left: '6%' },
    chipRight: { top: '21%', right: '6%' },
    chipBottomLeft: { bottom: '9%', left: '18%' },
    chipText: { fontSize: 13, fontWeight: '700' },
    slideTitle: {
      marginTop: space.x6,
      color: palette.ink,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    slideBody: {
      marginTop: space.x2,
      maxWidth: 360,
      color: palette.muted,
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: space.x2,
      paddingVertical: space.x4,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.surfaceContainerLow },
    dotActive: { width: 24, backgroundColor: palette.primary },
    footer: { paddingHorizontal: space.x6, paddingTop: space.x2 },
    actions: { gap: space.x3, width: '100%' },
    wideInner: {
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
    headline: {
      color: palette.ink,
      fontSize: 44,
      lineHeight: 50,
      fontWeight: '800',
      letterSpacing: -1,
    },
    lead: { color: palette.muted, fontSize: 19, lineHeight: 28 },
  });
};
