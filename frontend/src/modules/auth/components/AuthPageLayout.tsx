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
  badgeText = 'Desi Community Platform',
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
                <Text style={styles.showcaseHeadline}>
                  Connecting Desi Hearts Across Continents
                </Text>
                <Text style={styles.showcaseSubheadline}>
                  Find housing directly from community members, share commutes with community
                  carpools, ask for tech job referrals, and celebrate our shared culture together.
                </Text>
              </View>

              {/* Feature Highlights with Vector Icons */}
              <View style={styles.showcaseFeatureList}>
                <View style={styles.showcaseFeatureItem}>
                  <View style={styles.featureIconBubble}>
                    <AppIcon name="home" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.showcaseFeatureTextCol}>
                    <Text style={styles.showcaseFeatureTitle}>Rooms & Roommates</Text>
                    <Text style={styles.showcaseFeatureDesc}>
                      Direct community listings and lease sharing.
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
                      Daily commutes, airport rides, shared fuel costs.
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
                      Ask community members for employee referrals.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Trust Footer */}
              <View style={styles.showcaseFooterRow}>
                <AppIcon name="shield" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.showcaseSecurityText}>
                  Connections to ManaBandhu are encrypted in transit
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
  showcaseBrandSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  showcasePitchBlock: {
    gap: space.x2,
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
    width: '100%',
  },
  formPaneDesktop: {
    maxWidth: 480,
    width: 480,
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
    width: '100%',
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
