import { color as baseColors, space } from '@manabandhu/design-system';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

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

const onboardingSteps = {
  about: {
    step: 1,
    title: 'About You',
    body: 'Tell us a bit about yourself to get started.',
    inputs: ['First Name', 'Last Name', 'Preferred Name', 'Date of Birth'],
    options: [],
    next: '/onboarding/profile-photo',
  },
  photo: {
    step: 2,
    title: 'Profile Photo',
    body: 'Add a friendly photo so community members can recognize you.',
    inputs: [],
    options: ['Upload Photo', 'Use Initials', 'Skip for now'],
    next: '/onboarding/what-brings-you-here',
  },
  reason: {
    step: 3,
    title: 'What brings you here?',
    body: 'Select the ways ManaBandhu can help you.',
    inputs: [],
    options: [
      'Find a room',
      'Offer or request rides',
      'Find jobs',
      'Join community',
      'Local services',
    ],
    next: '/onboarding/location',
  },
  location: {
    step: 4,
    title: 'Your Location',
    body: 'Use a broad area to personalize discovery while protecting privacy.',
    inputs: ['City or neighborhood'],
    options: ['Use current location', 'Set manually'],
    next: '/onboarding/languages',
  },
  languages: {
    step: 5,
    title: 'Languages',
    body: 'Choose languages you are comfortable using.',
    inputs: [],
    options: ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Spanish'],
    next: '/onboarding/interests',
  },
  interests: {
    step: 6,
    title: 'Interests',
    body: 'Tune your home feed with what matters most.',
    inputs: [],
    options: ['Rooms', 'Rides', 'Jobs', 'Events', 'Immigration', 'Marketplace', 'Safety'],
    next: '/onboarding/notifications',
  },
  notifications: {
    step: 7,
    title: 'Notifications',
    body: 'Choose how ManaBandhu should keep you updated.',
    inputs: [],
    options: ['Room matches', 'Ride updates', 'Community replies', 'Safety alerts'],
    next: '/onboarding/trust-and-safety',
  },
  trust: {
    step: 8,
    title: 'Trust & Safety',
    body: 'Review privacy, reporting, and trusted contact settings.',
    inputs: [],
    options: ['Verify profile', 'Add trusted contact', 'Review safety tips'],
    next: '/onboarding/complete',
  },
  complete: {
    step: 9,
    title: 'You’re all set',
    body: 'Your ManaBandhu community is ready.',
    inputs: [],
    options: ['Explore home', 'Find a room', 'Offer a ride'],
    next: '/home',
  },
} as const;

export type OnboardingKind =
  | 'about'
  | 'photo'
  | 'reason'
  | 'location'
  | 'languages'
  | 'interests'
  | 'notifications'
  | 'trust'
  | 'complete';

export function StitchOnboardingScreen({ kind }: { kind: OnboardingKind }) {
  const step = onboardingSteps[kind];
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  function toggleOption(option: string) {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.min(step.step / 9, 1) * 100}%` }]}
            />
          </View>
          <Text style={styles.stepText}>Step {Math.min(step.step, 5)} of 5</Text>
        </View>
        <Text style={styles.onboardingTitle}>{step.title}</Text>
        <Text style={styles.onboardingBody}>{step.body}</Text>
        <View style={styles.form}>
          {kind === 'photo' ? (
            <View style={styles.photoCircle}>
              <Text style={styles.photoInitials}>S</Text>
            </View>
          ) : null}
          {step.inputs.map((input) => (
            <View key={input} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{input}</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField placeholder={input} />
              </Input>
            </View>
          ))}
          {step.options.length ? (
            <View style={styles.optionGrid}>
              {step.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => toggleOption(option)}
                  style={[
                    styles.optionChip,
                    selectedOptions.includes(option) && styles.optionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedOptions.includes(option) && styles.optionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.stickyFooter}>
          <AppButton label={kind === 'complete' ? 'Go to Home' : 'Continue'} route={step.next} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, padding: space.x4 },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    marginBottom: space.x6,
  },
  progressTrack: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.primary, borderRadius: 999, height: '100%' },
  stepText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  onboardingTitle: { color: colors.ink, fontSize: 26, fontWeight: '800', lineHeight: 34 },
  onboardingBody: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: space.x6 },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  optionChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  optionChipActive: { backgroundColor: colors.primary },
  optionText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  optionTextActive: { color: colors.surface },
  photoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 64,
    height: 128,
    justifyContent: 'center',
    width: 128,
  },
  photoInitials: { color: colors.primary, fontSize: 40, fontWeight: '800' },
  stickyFooter: { marginTop: 'auto', paddingTop: space.x6 },
});
