import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getWelcomeFlow } from '@/modules/foundation/api';
import {
  fallbackWelcomeFlow,
  foundationQueryKeys,
  foundationRoutes,
  welcomeFlowTiming,
} from '@/modules/foundation/foundationConstants';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function SplashScreen() {
  const layout = useAdaptiveLayout();
  const welcome = useQuery({ queryKey: foundationQueryKeys.welcome, queryFn: getWelcomeFlow });
  const content = welcome.data?.splash ?? fallbackWelcomeFlow.splash;

  useEffect(() => {
    const timer = setTimeout(
      () => router.replace(foundationRoutes.welcome),
      welcomeFlowTiming.splashDurationMs,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, layout.windowClass !== 'compact' && styles.pageExpanded]}>
        <View style={styles.logoFrame}>
          <Image accessibilityIgnoresInvertColors source={welcomeLogo} style={styles.logo} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.brand}>{content.brand}</Text>
          <Text style={styles.tagline}>{content.tagline}</Text>
        </View>
        <View style={styles.loadingRow} accessibilityLabel="Loading welcome flow">
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>
            {welcome.isError ? 'Using saved welcome content' : 'Preparing your community'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primarySoft },
  page: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    flex: 1,
    gap: space.x6,
    justifyContent: 'center',
    padding: space.x8,
  },
  pageExpanded: { alignSelf: 'center', maxWidth: 620, width: '100%' },
  logoFrame: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.panel,
    borderWidth: 1,
    height: 128,
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    width: 128,
  },
  logo: { borderRadius: radius.card, height: 112, width: 112 },
  copy: { alignItems: 'center', gap: space.x2 },
  brand: { color: '#1a0063', fontSize: 36, fontWeight: '800', lineHeight: 44 },
  tagline: { color: colors.ink, fontSize: 18, lineHeight: 28, maxWidth: 280, textAlign: 'center' },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: space.x3, minHeight: 32 },
  loadingText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
