import { color as baseColors, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
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

export function StitchSplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/welcome'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.splash}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip splash and go to welcome"
        onPress={() => router.replace('/welcome')}
        style={styles.splashInner}
      >
        <Image accessibilityIgnoresInvertColors source={welcomeLogo} style={styles.splashLogo} />
        <Text style={styles.splashBrand}>ManaBandhu</Text>
        <Text style={styles.splashTagline}>Your trusted community, wherever you are.</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  splashInner: { alignItems: 'center', gap: space.x3, padding: space.x8 },
  splashLogo: { borderRadius: 28, height: 128, width: 128 },
  splashBrand: { color: colors.primary, fontSize: 36, fontWeight: '800', lineHeight: 44 },
  splashTagline: { color: colors.muted, fontSize: 18, lineHeight: 28, textAlign: 'center' },
});
