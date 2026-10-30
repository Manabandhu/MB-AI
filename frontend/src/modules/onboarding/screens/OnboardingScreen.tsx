import { space } from '@manabandhu/design-system';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAppearance } from '@/theme/ThemeProvider';
import { STEP_VIEWS } from '../components/steps';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { makeStyles } from '../styles';
import type { OnboardingStepKey } from '../utils/stepMeta';

export type { OnboardingStepKey } from '../utils/stepMeta';

/**
 * One onboarding step: header with progress, the step view from `onboarding/steps`, and the docked action bar.
 * State and saving live in `useOnboardingFlow`; step order and routes in `onboarding/stepMeta`.
 */
export function OnboardingScreen({ kind }: { kind: OnboardingStepKey }) {
  const insets = useSafeAreaInsets();
  const { palette: colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const flow = useOnboardingFlow(kind);
  const {
    meta,
    config,
    isConfigLoading,
    configError,
    refetchConfig,
    progressLoading,
    saveStepMutation,
    completeMutation,
    saveError,
    stepConfig,
    progressPercent,
    handleNext,
    handleBack,
    handleSkip,
    finishLater,
    allPledged,
    pledgeMissing,
  } = flow;
  const StepView = STEP_VIEWS[meta.index - 1] ?? STEP_VIEWS[0];

  // Loading skeleton state
  if (isConfigLoading && !config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Setting up your community experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (configError && !config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <AppIcon color={colors.warm} name="warning" size={40} />
          <Text style={styles.errorTitle}>Unable to load onboarding</Text>
          <Text style={styles.errorSub}>Please check your connection and try again.</Text>
          <View style={{ marginTop: space.x4, width: 200 }}>
            <AppButton label="Retry" onPress={() => refetchConfig()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.adaptiveWrapper}>
        {/* Top App Bar & Progress Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleBack}
              style={styles.backButton}
            >
              <AppIcon color={colors.ink} name="chevron-left" size={24} />
            </Pressable>

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {meta.index} of 8</Text>
            </View>

            {meta.index < 7 ? (
              <Pressable
                accessibilityLabel="Skip this step"
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Progress track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline & Subtitle */}
          <View style={styles.headlineGroup}>
            <View style={styles.categoryPill}>
              <AppIcon color={colors.primary} name="sparks" size={14} />
              <Text style={styles.categoryPillText}>PERSONALIZED SETUP</Text>
            </View>
            <Text style={styles.titleText}>
              {stepConfig?.title ||
                (meta.index === 8 ? 'You’re All Set!' : 'Welcome to ManaBandhu')}
            </Text>
            {stepConfig?.subtitle ? (
              <Text style={styles.subtitleText}>{stepConfig.subtitle}</Text>
            ) : null}
          </View>

          <StepView colors={colors} flow={flow} styles={styles} />
        </ScrollView>

        {/* Docked Sticky Bottom Action Bar, clear of the iPhone home indicator */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.x4) }]}>
          {saveError ? (
            <Text accessibilityRole="alert" style={styles.saveError}>
              {saveError}
            </Text>
          ) : null}
          {meta.key === 'trust_safety' && !allPledged && !saveError ? (
            <Text style={styles.pledgeHint}>Agree to each pledge above to continue.</Text>
          ) : null}
          {pledgeMissing ? (
            <Text style={styles.pledgeHint}>
              Agree to the Community Trust Code to finish setting up.
            </Text>
          ) : null}
          <AppButton
            disabled={
              saveStepMutation.isPending ||
              completeMutation.isPending ||
              !allPledged ||
              (meta.index === 8 && progressLoading)
            }
            icon={meta.index === 8 ? (pledgeMissing ? 'shield' : 'home') : undefined}
            iconAfter={meta.index === 8 ? undefined : 'chevron-right'}
            label={
              saveStepMutation.isPending || completeMutation.isPending
                ? 'Saving...'
                : meta.index === 8
                  ? pledgeMissing
                    ? 'Review the Trust Code'
                    : 'Explore ManaBandhu'
                  : 'Continue'
            }
            onPress={handleNext}
          />
          {meta.index < 8 ? (
            <AppButton label="Finish setup later" onPress={finishLater} variant="ghost" />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
