import { color as baseColors, space } from '@manabandhu/design-system';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { welcomeLogo } from '@/modules/foundation/welcomeAssets';

const colors = {
  ...baseColors,
  appPrimary: '#2c0096',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  appShellSurface: '#efedf4',
  warm: '#ff7e33',
};

const welcomeImages = {
  help: 'https://lh3.googleusercontent.com/aida/AP1WRLuihH-mSVxYhIAX0g3XSpYMHRaSs0kbK5uQCKWYinPX-8Gkfl0D6QOOYna7jkBL-XBFoAgVulXErCpyQxyPCXcAFjLvy8jUchV2mluO1-uL1mm0N53J5icFnoXEut4vWkPDovzsDhbjMYB3SbmrvZvVAFyhDinQIniIh2UHI3jjzSfcdaU86ZtypYnANXAoePqFb5RoSedJnEh9vDlYoCc5JD_MXTe_2yhbvQKJTTzwkevVyWz28B_ktfg',
  trust:
    'https://lh3.googleusercontent.com/aida/AP1WRLtUf2ODs2thv2Z3Tn-zrq2aaYnq5daSL9KBeeHzLFYPNJDJO4vD7UcsoIaltEvAbFrubE_vZrNGdGO7BzEX972UyQL9JthY2LS5FgRQMeLeAS43Xo2flktTuSUyxHVbfsTJ4G76kcuaR1yjJrSb6yZIoYTXfaPKaAkfNWGohBFMJV2Oa5QuO7-okaQO5kx7T2Gw7fqG8KggE0Vdny10VVgAS-d0JbHYNSThckQ6FCLQaVD-scfhzIQK9x8',
  life: 'https://lh3.googleusercontent.com/aida/AP1WRLsnX0Z0wRXO1bksJlF36mVKcxGpWmLHDKh29_dDO-daHA-WP1kZN6-es7SZecpR_E9zdLoffF80G3fOX9M0i3_caLaWhTKfh0-eg85lYLp4mxvpEOp4DdqjjekgMhByhMLrJggPuIra_sofSIGmHJ6DnTE4EOKEaGGD04XoInVhxLtiYar_nTsvhPklWvpaxQOZ_9-FLtTUoVx71PxgUfThSVk0lbXBgQ0v1ODZt0a9mZ_Z62QyFc52xCs',
};

const welcomeSteps = [
  {
    title: 'Find the help you need',
    body: 'Rooms, rides, jobs, local services, and useful information in one friendly app.',
    image: welcomeImages.help,
    action: 'Next',
  },
  {
    title: 'Connect with people you can trust',
    body: 'Ask questions, join communities, chat safely, and meet people nearby.',
    image: welcomeImages.trust,
    action: 'Next',
  },
  {
    title: 'Make everyday life easier.',
    body: 'Share expenses, find events, track packages, and stay organized.',
    image: welcomeImages.life,
    action: 'Next',
  },
  {
    title: 'Welcome to ManaBandhu',
    body: 'Your global community for meaningful connections and support is ready.',
    image: null,
    action: 'Get Started',
  },
];

export function StitchWelcomeFlowScreen() {
  const [index, setIndex] = useState(0);
  const step = welcomeSteps[index];
  const isFinal = index === welcomeSteps.length - 1;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) advance();
        if (gesture.dx > 50) setIndex((current) => Math.max(current - 1, 0));
      },
    }),
  ).current;

  function advance() {
    if (isFinal) router.push('/sign-in');
    else setIndex((current) => Math.min(current + 1, welcomeSteps.length - 1));
  }

  return (
    <SafeAreaView style={styles.welcomeSafe}>
      <View style={styles.welcomePage} {...panResponder.panHandlers}>
        <View style={styles.welcomeTop}>
          {isFinal ? <Text style={styles.skip}>Skip</Text> : <Text />}
        </View>
        <View style={[styles.welcomeVisual, isFinal && styles.welcomeLogoFrame]}>
          {step.image ? (
            <Image source={{ uri: step.image }} style={styles.welcomeImage} />
          ) : (
            <Image source={welcomeLogo} style={styles.welcomeLogo} />
          )}
        </View>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcomeTitle}>{step.title}</Text>
          <Text style={styles.welcomeBody}>{step.body}</Text>
        </View>
        <View style={styles.dots}>
          {welcomeSteps.map((item, dotIndex) => (
            <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={advance} style={styles.primaryPill}>
          <Text style={styles.primaryPillText}>{step.action}</Text>
        </Pressable>
        {isFinal ? (
          <>
            <Link href="/sign-in" asChild>
              <Pressable accessibilityRole="button" style={styles.secondaryPill}>
                <Text style={styles.secondaryPillText}>Sign In</Text>
              </Pressable>
            </Link>
            <Text style={styles.safeNote}>
              Your data is safe and private. We never share your personal information.
            </Text>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeSafe: { backgroundColor: colors.background, flex: 1 },
  welcomePage: { flex: 1, gap: space.x6, justifyContent: 'center', padding: space.x4 },
  welcomeTop: { minHeight: 28 },
  skip: { alignSelf: 'flex-end', color: colors.primary, fontSize: 14, fontWeight: '700' },
  welcomeVisual: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  welcomeLogoFrame: { alignSelf: 'center', borderRadius: 80, height: 160, width: 160 },
  welcomeImage: { height: '100%', width: '100%' },
  welcomeLogo: { borderRadius: 72, height: 144, width: 144 },
  welcomeCopy: { alignItems: 'center', gap: space.x3 },
  welcomeTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
  welcomeBody: { color: colors.muted, fontSize: 17, lineHeight: 27, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: space.x2, justifyContent: 'center' },
  dot: { backgroundColor: colors.border, borderRadius: 4, height: 8, width: 8 },
  dotActive: { backgroundColor: colors.primary, width: 32 },
  primaryPill: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryPillText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  secondaryPill: {
    alignItems: 'center',
    borderRadius: 999,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryPillText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  safeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
