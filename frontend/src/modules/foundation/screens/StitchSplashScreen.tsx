import { color, space } from '@manabandhu/design-system';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';

export function StitchSplashScreen() {
  const rootNavigationState = useRootNavigationState();
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  useEffect(() => {
    if (!rootNavigationState?.key || isLoading) return;

    const redirectTimer = setTimeout(() => {
      if (status === 'authenticated') {
        router.replace('/home');
      } else {
        router.replace('/welcome');
      }
    }, 1800);

    return () => clearTimeout(redirectTimer);
  }, [isLoading, rootNavigationState?.key, status]);

  const navigateToWelcome = () => {
    if (rootNavigationState?.key) {
      if (status === 'authenticated') {
        router.replace('/home');
      } else {
        router.replace('/welcome');
      }
    }
  };

  return (
    <SafeAreaView style={styles.splash}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Advance splash screen"
        onPress={navigateToWelcome}
        style={styles.splashInner}
      >
        <View style={styles.badgeContainer}>
          <View style={styles.glowRingOuter}>
            <View style={styles.glowRingInner}>
              <Image
                accessibilityIgnoresInvertColors
                source={welcomeLogo}
                style={styles.splashLogo}
              />
            </View>
          </View>
        </View>

        <View style={styles.brandBlock}>
          <Text style={styles.splashBrand}>ManaBandhu</Text>
          <Text style={styles.splashTagline}>Your Community, Your Bandhu</Text>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressBar}>
            <View style={styles.progressBarFill} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>Loading community network...</Text>
          </View>
        </View>

        <View style={styles.footerBlock}>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>🛡️ ManaBandhu Ecosystem • Safe & Verified</Text>
          </View>
          <Text style={styles.footerText}>Connecting people, empowering lives</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    backgroundColor: color.background,
    flex: 1,
    justifyContent: 'center',
  },
  splashInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.x6,
    paddingVertical: space.x8,
    width: '100%',
    maxWidth: 480,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.x12,
  },
  glowRingOuter: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 120,
    justifyContent: 'center',
    padding: space.x4,
  },
  glowRingInner: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.16)',
    borderRadius: 90,
    borderWidth: 2,
    justifyContent: 'center',
    padding: space.x2,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  splashLogo: {
    borderRadius: 80,
    height: 140,
    width: 140,
  },
  brandBlock: {
    alignItems: 'center',
    gap: space.x2,
    marginTop: space.x4,
  },
  splashBrand: {
    color: color.primary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  splashTagline: {
    color: color.muted,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  progressBlock: {
    alignItems: 'center',
    gap: space.x3,
    marginVertical: space.x6,
    width: '80%',
    maxWidth: 280,
  },
  progressBar: {
    backgroundColor: color.primarySoft,
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    backgroundColor: color.primary,
    borderRadius: 999,
    height: '100%',
    width: '65%',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  pulseDot: {
    backgroundColor: color.warm,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusText: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  footerBlock: {
    alignItems: 'center',
    gap: space.x2,
    marginBottom: space.x4,
  },
  trustBadge: {
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  trustBadgeText: {
    color: color.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  footerText: {
    color: color.muted,
    fontSize: 12,
    fontWeight: '500',
  },
});
