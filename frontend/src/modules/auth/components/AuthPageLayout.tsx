import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { welcomeLogo } from '@/modules/foundation/welcomeAssets';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

interface AuthPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badgeText?: string;
  showBack?: boolean;
  backHref?: string;
}

export function AuthPageLayout({
  children,
  title,
  subtitle,
  badgeText = 'Verified Desi Community',
  showBack = true,
  backHref = '/welcome',
}: AuthPageLayoutProps) {
  const { windowClass } = useAdaptiveLayout();
  const isDesktop = windowClass === 'expanded' || windowClass === 'wide';
  const isTablet = windowClass === 'medium';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View
          style={[
            styles.mainWrapper,
            isTablet && styles.mainWrapperTablet,
            isDesktop && styles.mainWrapperDesktop,
          ]}
        >
          {/* Left Branded Showcase for Desktop Web */}
          {isDesktop ? (
            <View style={styles.showcasePane}>
              {/* Brand Header */}
              <Pressable
                onPress={() => router.push('/welcome')}
                style={styles.showcaseBrandRow}
                accessibilityRole="button"
                accessibilityLabel="Go to welcome page"
              >
                <Image source={welcomeLogo} style={styles.showcaseLogo} />
                <View>
                  <View style={styles.showcaseBrandTitleRow}>
                    <Text style={styles.showcaseBrandTitle}>ManaBandhu</Text>
                  </View>
                  <Text style={styles.showcaseBrandSubtitle}>Desi Community Platform</Text>
                </View>
              </Pressable>

              {/* Showcase Pitch */}
              <View style={styles.showcasePitchBlock}>
                <View style={styles.showcaseTagPill}>
                  <Text style={styles.showcaseTagText}>#1 Trusted Community</Text>
                </View>
                <Text style={styles.showcaseHeadline}>
                  Connecting Desi Hearts Across Continents
                </Text>
                <Text style={styles.showcaseSubheadline}>
                  Find verified housing directly from community members, commute safely with
                  community carpools, unlock tech job referrals, and celebrate our shared culture
                  together.
                </Text>
              </View>

              {/* Feature Highlights with Vector Icons */}
              <View style={styles.showcaseFeatureList}>
                <View style={styles.showcaseFeatureItem}>
                  <View style={styles.featureIconBubble}>
                    <AppIcon name="home" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.showcaseFeatureTextCol}>
                    <Text style={styles.showcaseFeatureTitle}>Verified Rooms & Roommates</Text>
                    <Text style={styles.showcaseFeatureDesc}>
                      Direct community listings, background checks, lease sharing.
                    </Text>
                  </View>
                </View>

                <View style={styles.showcaseFeatureItem}>
                  <View style={styles.featureIconBubble}>
                    <AppIcon name="car" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.showcaseFeatureTextCol}>
                    <Text style={styles.showcaseFeatureTitle}>Community Carpools</Text>
                    <Text style={styles.showcaseFeatureDesc}>
                      Trusted daily commutes, airport pickups, shared fuel.
                    </Text>
                  </View>
                </View>

                <View style={styles.showcaseFeatureItem}>
                  <View style={styles.featureIconBubble}>
                    <AppIcon name="briefcase" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.showcaseFeatureTextCol}>
                    <Text style={styles.showcaseFeatureTitle}>Tech Referrals & Mentorship</Text>
                    <Text style={styles.showcaseFeatureDesc}>
                      Direct employee referrals at top tech companies.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Testimonial Quote Card */}
              <View style={styles.showcaseTestimonialCard}>
                <Text style={styles.showcaseQuoteMarks}>“</Text>
                <Text style={styles.showcaseQuoteText}>
                  ManaBandhu helped me find a safe room in Dallas within 48 hours of landing in the
                  US. The community verification gave my parents total peace of mind!
                </Text>
                <View style={styles.showcaseAuthorRow}>
                  <View style={styles.showcaseAuthorAvatar}>
                    <Text style={styles.showcaseAuthorInitial}>P</Text>
                  </View>
                  <View>
                    <Text style={styles.showcaseAuthorName}>Priya V.</Text>
                    <Text style={styles.showcaseAuthorRole}>Software Engineer • Dallas, TX</Text>
                  </View>
                </View>
              </View>

              {/* Trust Footer */}
              <View style={styles.showcaseFooterRow}>
                <AppIcon name="shield" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.showcaseSecurityText}>
                  256-Bit TLS Encryption • 100% Privacy Preserved
                </Text>
              </View>
            </View>
          ) : null}

          {/* Right/Center Form Container */}
          <View style={[styles.formPane, isDesktop && styles.formPaneDesktop]}>
            {/* Mobile Header */}
            <View style={styles.formHeaderRow}>
              {showBack ? (
                <Pressable
                  onPress={() => router.push(backHref as never)}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <AppIcon name="chevron-left" size={16} color={color.muted} />
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable
                onPress={() => router.push('/welcome')}
                style={styles.mobileBrandBadge}
                accessibilityRole="button"
              >
                <Image source={welcomeLogo} style={styles.mobileLogo} />
                <Text style={styles.mobileBrandName}>ManaBandhu</Text>
              </Pressable>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Trust Pill */}
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>

              {/* Title & Subtitle */}
              <View style={styles.headerTextBlock}>
                <Text style={styles.screenTitle}>{title}</Text>
                <Text style={styles.screenSubtitle}>{subtitle}</Text>
              </View>

              {/* Form Content / Children */}
              <View style={styles.formBody}>{children}</View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: color.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.x3,
  },
  scrollContentDesktop: {
    padding: space.x5,
  },
  mainWrapper: {
    alignSelf: 'center',
    maxWidth: 460,
    width: '100%',
  },
  mainWrapperTablet: {
    maxWidth: 540,
  },
  mainWrapperDesktop: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: space.x6,
    maxWidth: 1120,
    paddingVertical: space.x6,
  },
  showcasePane: {
    backgroundColor: color.primary,
    borderRadius: 28,
    flex: 1.1,
    gap: space.x5,
    justifyContent: 'space-between',
    padding: space.x6,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  showcaseBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
  },
  showcaseLogo: {
    borderRadius: 12,
    height: 44,
    width: 44,
  },
  showcaseBrandTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x1,
  },
  showcaseBrandTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  showcaseVerifiedBadge: {
    alignItems: 'center',
    backgroundColor: color.teal,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  showcaseBrandSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  showcasePitchBlock: {
    gap: space.x2,
  },
  showcaseTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: space.x3,
    paddingVertical: 4,
  },
  showcaseTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  showcaseHeadline: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  showcaseSubheadline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
  },
  showcaseFeatureList: {
    gap: space.x3,
  },
  showcaseFeatureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  featureIconBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  showcaseFeatureTextCol: {
    flex: 1,
  },
  showcaseFeatureTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  showcaseFeatureDesc: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 16,
  },
  showcaseTestimonialCard: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  showcaseQuoteMarks: {
    color: color.warm,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 20,
  },
  showcaseQuoteText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  showcaseAuthorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    marginTop: space.x1,
  },
  showcaseAuthorAvatar: {
    alignItems: 'center',
    backgroundColor: color.warm,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  showcaseAuthorInitial: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  showcaseAuthorName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  showcaseAuthorRole: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  showcaseFooterRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    paddingTop: space.x3,
  },
  showcaseSecurityText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  formPane: {
    flex: 1,
    gap: space.x3,
    justifyContent: 'center',
  },
  formPaneDesktop: {
    maxWidth: 480,
  },
  formHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x1,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: space.x2,
  },
  backButtonText: {
    color: color.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  mobileBrandBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x1,
  },
  mobileLogo: {
    borderRadius: 6,
    height: 24,
    width: 24,
  },
  mobileBrandName: {
    color: color.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: space.x4,
    padding: space.x5,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  badgePill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 999,
    paddingHorizontal: space.x3,
    paddingVertical: 4,
  },
  badgeText: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTextBlock: {
    alignItems: 'center',
    gap: space.x1,
  },
  screenTitle: {
    color: color.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  screenSubtitle: {
    color: color.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  formBody: {
    gap: space.x4,
  },
});
