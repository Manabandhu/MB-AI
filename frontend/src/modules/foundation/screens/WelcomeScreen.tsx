import { color as colors, contentWidth, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getWelcomeFlow } from '@/modules/foundation/api';
import { PillButton } from '@/modules/foundation/components/PillButton';
import { ProgressDots } from '@/modules/foundation/components/ProgressDots';
import {
  fallbackWelcomeFlow,
  foundationQueryKeys,
  foundationRoutes,
} from '@/modules/foundation/foundationConstants';
import { welcomeImageSource } from '@/modules/foundation/welcomeAssets';
import {
  clampWelcomeStepIndex,
  getWelcomeSteps,
  isFinalWelcomeStep,
} from '@/modules/foundation/welcomeUtils';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function WelcomeScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const layout = useAdaptiveLayout();
  const welcome = useQuery({ queryKey: foundationQueryKeys.welcome, queryFn: getWelcomeFlow });
  const flow = welcome.data ?? fallbackWelcomeFlow;
  const steps = getWelcomeSteps(flow);
  const safeStepIndex = clampWelcomeStepIndex(stepIndex, steps.length);
  const step = steps[safeStepIndex];
  const isFinalStep = isFinalWelcomeStep(safeStepIndex, steps.length);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) {
          goToNextStep();
          return;
        }
        if (gesture.dx > 50) goToPreviousStep();
      },
    }),
  ).current;
  const shellStyle = useMemo(
    () => [
      styles.shell,
      {
        maxWidth:
          layout.windowClass === 'compact'
            ? contentWidth.compact
            : Math.min(layout.maxContentWidth, 760),
      },
    ],
    [layout.maxContentWidth, layout.windowClass],
  );

  function goToNextStep() {
    if (isFinalStep) {
      router.replace(foundationRoutes.home);
      return;
    }
    setStepIndex((current) => clampWelcomeStepIndex(current + 1, steps.length));
  }

  function goToPreviousStep() {
    setStepIndex((current) => clampWelcomeStepIndex(current - 1, steps.length));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={shellStyle} {...panResponder.panHandlers}>
          <View style={styles.topBar}>
            {!isFinalStep ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setStepIndex(steps.length - 1)}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={styles.skipButton} />
            )}
          </View>

          <View style={[styles.visualFrame, isFinalStep && styles.logoVisualFrame]}>
            <Image
              accessibilityIgnoresInvertColors
              source={welcomeImageSource(step.id, step.imageUrl)}
              style={[styles.visual, isFinalStep && styles.logoVisual]}
            />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>
            {welcome.isError ? (
              <Text style={styles.offlineNote}>Showing saved welcome content</Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <ProgressDots count={steps.length} index={safeStepIndex} />

            <PillButton label={step.actionLabel} onPress={goToNextStep} />

            {step.secondaryActionLabel ? (
              <PillButton
                label={step.secondaryActionLabel}
                onPress={() => router.replace(foundationRoutes.home)}
                variant="secondary"
              />
            ) : null}

            {isFinalStep ? (
              <Text style={styles.privacyText}>
                Your data is safe and private. We never share your personal information.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    backgroundColor: colors.background,
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  shell: {
    alignSelf: 'center',
    flex: 1,
    gap: space.x6,
    justifyContent: 'space-between',
    width: '100%',
  },
  topBar: { alignItems: 'flex-end', minHeight: 44 },
  skipButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 64 },
  skipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  visualFrame: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.panel,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: '100%',
  },
  logoVisualFrame: { alignSelf: 'center', borderRadius: 80, height: 160, width: 160 },
  visual: { height: '100%', resizeMode: 'cover', width: '100%' },
  logoVisual: { borderRadius: 72, height: 144, width: 144 },
  copy: { alignItems: 'center', gap: space.x3, paddingHorizontal: space.x2 },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  body: { color: colors.muted, fontSize: 17, lineHeight: 27, maxWidth: 430, textAlign: 'center' },
  offlineNote: { color: colors.teal, fontSize: 12, fontWeight: '700' },
  footer: { gap: space.x4, paddingBottom: space.x4 },
  privacyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
