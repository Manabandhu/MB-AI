import { color, space } from '@manabandhu/design-system';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';

export function StitchSplashScreen() {
  const rootNavigationState = useRootNavigationState();
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    useAuthStore.getState().checkSession();

    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // 2. Continuous breathing glow loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.14,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowPulse, {
          toValue: 1.0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    glowLoop.start();

    // 3. Continuous pulse dot loop
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(dotPulse, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    dotLoop.start();

    return () => {
      glowLoop.stop();
      dotLoop.stop();
    };
  }, [dotPulse, fadeAnim, glowPulse, progressAnim, scaleAnim]);

  useEffect(() => {
    let redirected = false;
    const doRedirect = () => {
      if (redirected) return;
      redirected = true;
      if (status === 'authenticated') {
        router.replace('/home');
      } else {
        router.replace('/welcome');
      }
    };

    // If session check already settled, transition smoothly
    if (rootNavigationState?.key && !isLoading) {
      const redirectTimer = setTimeout(doRedirect, 1400);
      return () => clearTimeout(redirectTimer);
    }

    // Safety fallback: Never trap the user on the splash screen for more than 2.2 seconds
    const fallbackTimer = setTimeout(doRedirect, 2200);
    return () => clearTimeout(fallbackTimer);
  }, [isLoading, rootNavigationState?.key, status]);

  const navigateToWelcome = () => {
    const currentStatus = useAuthStore.getState().status;
    if (currentStatus === 'authenticated') {
      router.replace('/home');
    } else {
      router.replace('/welcome');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.splash}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Advance splash screen"
        onPress={navigateToWelcome}
        style={styles.splashInner}
      >
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowRingOuter,
              {
                transform: [{ scale: glowPulse }],
              },
            ]}
          >
            <View style={styles.glowRingInner}>
              <Image
                accessibilityIgnoresInvertColors
                source={welcomeLogo}
                style={styles.splashLogo}
              />
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.brandBlock, { opacity: fadeAnim }]}>
          <Text style={styles.splashBrand}>ManaBandhu</Text>
          <Text style={styles.splashTagline}>Your Community, Your Bandhu</Text>
        </Animated.View>

        <Animated.View style={[styles.progressBlock, { opacity: fadeAnim }]}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={color.primary} />
            <Text style={styles.statusText}>Loading community network...</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.footerBlock, { opacity: fadeAnim }]}>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>🛡️ ManaBandhu Ecosystem • Safe & Verified</Text>
          </View>
          <Text style={styles.footerText}>Connecting people, empowering lives</Text>
        </Animated.View>
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
    backgroundColor: 'rgba(67, 30, 190, 0.10)',
    borderRadius: 130,
    justifyContent: 'center',
    padding: space.x4,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 8,
  },
  glowRingInner: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.18)',
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
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    backgroundColor: color.primary,
    borderRadius: 999,
    height: '100%',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  pulseDot: {
    backgroundColor: color.warm,
    borderRadius: 5,
    height: 10,
    width: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
