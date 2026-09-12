import { color, space } from '@manabandhu/design-system';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';

const featurePillars = [
  {
    icon: '🏠',
    title: 'Verified Rooms',
    desc: 'Safe homes with verified background checks.',
    tag: 'Zero Brokerage',
    tagBg: 'rgba(67, 30, 190, 0.08)',
    tagColor: color.primary,
  },
  {
    icon: '🚗',
    title: 'Community Carpools',
    desc: 'Ride together and cut daily travel expenses.',
    tag: 'Trusted Routes',
    tagBg: 'rgba(0, 105, 107, 0.10)',
    tagColor: color.teal,
  },
  {
    icon: '💼',
    title: 'Job Referrals',
    desc: 'Direct recommendations and hiring tips.',
    tag: 'Fast Track',
    tagBg: 'rgba(255, 126, 51, 0.12)',
    tagColor: color.warm,
  },
  {
    icon: '🤝',
    title: 'Hub & Events',
    desc: 'Festivals, local meetups & peer support.',
    tag: 'Active 24/7',
    tagBg: 'rgba(67, 30, 190, 0.08)',
    tagColor: color.primary,
  },
];

export function StitchWelcomeFlowScreen() {
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, isLoading]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.pageContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Image source={welcomeLogo} style={styles.brandLogo} />
              <View>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>ManaBandhu</Text>
                  <View style={styles.verifiedDot}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                </View>
                <Text style={styles.brandSubtitle}>Community Network</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip to sign in"
              onPress={() => router.push('/sign-in')}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Hero Visual Card */}
          <View style={styles.heroCard}>
            <View style={styles.floatingBadgeLeft}>
              <Text style={styles.floatingBadgeText}>🛡️ Verified Members</Text>
            </View>
            <View style={styles.heroIllustrationFrame}>
              <Image source={welcomeLogo} style={styles.heroEmblem} resizeMode="contain" />
            </View>
            <View style={styles.floatingBadgeRight}>
              <Text style={styles.floatingBadgeText}>⭐ 4.9 ★ Community Trust</Text>
            </View>
          </View>

          {/* Headline & Value Proposition */}
          <View style={styles.copyBlock}>
            <Text style={styles.mainHeading}>Your Trusted Community, Everywhere You Go</Text>
            <Text style={styles.mainSubheading}>
              Find verified rooms, share rides with friends, get trusted job referrals, and stay
              connected with your community.
            </Text>
          </View>

          {/* Feature Pillars Grid */}
          <View style={styles.featureGrid}>
            {featurePillars.map((pillar) => (
              <View key={pillar.title} style={styles.featureCard}>
                <View style={styles.featureCardHeader}>
                  <Text style={styles.featureIcon}>{pillar.icon}</Text>
                  <View style={[styles.featureTag, { backgroundColor: pillar.tagBg }]}>
                    <Text style={[styles.featureTagText, { color: pillar.tagColor }]}>
                      {pillar.tag}
                    </Text>
                  </View>
                </View>
                <Text style={styles.featureTitle}>{pillar.title}</Text>
                <Text style={styles.featureDesc}>{pillar.desc}</Text>
              </View>
            ))}
          </View>

          {/* Stepper Dots */}
          <View style={styles.dotsRow}>
            <View style={styles.dotActive} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* CTA Buttons */}
          <View style={styles.actionsBlock}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/sign-up')}
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Get Started →</Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              <Text style={styles.secondaryPrompt}>Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.secondaryLink}>Sign In</Text>
                </Pressable>
              </Link>
            </View>

            <Text style={styles.termsNote}>
              By continuing, you agree to ManaBandhu Terms of Service & Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: color.background, flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: space.x4 },
  pageContainer: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: space.x5,
    paddingVertical: space.x2,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x1,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  brandLogo: { borderRadius: 10, height: 38, width: 38 },
  brandTitleRow: { alignItems: 'center', flexDirection: 'row', gap: space.x1 },
  brandTitle: { color: color.primary, fontSize: 18, fontWeight: '800' },
  verifiedDot: {
    alignItems: 'center',
    backgroundColor: color.teal,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  verifiedCheck: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  brandSubtitle: { color: color.muted, fontSize: 11, fontWeight: '600' },
  skipButton: { padding: space.x2 },
  skipText: { color: color.muted, fontSize: 14, fontWeight: '700' },
  heroCard: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 180,
    padding: space.x4,
    position: 'relative',
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroIllustrationFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.x3,
  },
  heroEmblem: { height: 96, width: 96, borderRadius: 20 },
  floatingBadgeLeft: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    left: space.x3,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    position: 'absolute',
    top: space.x3,
  },
  floatingBadgeRight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    position: 'absolute',
    bottom: space.x3,
    right: space.x3,
  },
  floatingBadgeText: { color: color.ink, fontSize: 11, fontWeight: '700' },
  copyBlock: { alignItems: 'center', gap: space.x2, paddingHorizontal: space.x2 },
  mainHeading: {
    color: color.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
    textAlign: 'center',
  },
  mainSubheading: {
    color: color.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  featureCard: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: space.x1,
    padding: space.x3,
  },
  featureCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.x1,
  },
  featureIcon: { fontSize: 22 },
  featureTag: {
    borderRadius: 999,
    paddingHorizontal: space.x2,
    paddingVertical: 2,
  },
  featureTagText: { fontSize: 10, fontWeight: '800' },
  featureTitle: { color: color.ink, fontSize: 14, fontWeight: '800' },
  featureDesc: { color: color.muted, fontSize: 12, lineHeight: 17 },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    marginVertical: space.x1,
  },
  dot: { backgroundColor: color.border, borderRadius: 4, height: 6, width: 6 },
  dotActive: { backgroundColor: color.primary, borderRadius: 4, height: 6, width: 24 },
  actionsBlock: { gap: space.x3, marginTop: space.x2 },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: color.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryCtaText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  secondaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryPrompt: { color: color.muted, fontSize: 14, fontWeight: '600' },
  secondaryLink: { color: color.primary, fontSize: 14, fontWeight: '800' },
  termsNote: {
    color: color.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
