import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';

export function ChooseLoginMethodScreen() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSocial(provider: 'apple' | 'google') {
    setLoadingProvider(provider);
    setError(null);
    try {
      await useAuthStore.getState().signInWithOAuth(provider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `${provider} login failed`;
      setError(msg);
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <AuthPageLayout
      title="Choose Sign-In Method"
      subtitle="Select your preferred way to authenticate with ManaBandhu"
      badgeText="🔐 Flexible & Secure Sign-In"
      backHref="/sign-in"
    >
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.methodsCol}>
        {/* Method 1: Phone Login */}
        <Pressable
          onPress={() => router.push('/phone-login')}
          style={styles.methodCard}
          accessibilityRole="button"
        >
          <View style={styles.methodIconWrap}>
            <Text style={styles.methodIcon}>📱</Text>
          </View>
          <View style={styles.methodTextCol}>
            <Text style={styles.methodTitle}>Phone Number</Text>
            <Text style={styles.methodDesc}>Instant SMS verification code to your mobile</Text>
          </View>
          <Text style={styles.methodArrow}>→</Text>
        </Pressable>

        {/* Method 2: Email & Password */}
        <Pressable
          onPress={() => router.push('/email-login')}
          style={styles.methodCard}
          accessibilityRole="button"
        >
          <View style={styles.methodIconWrap}>
            <Text style={styles.methodIcon}>✉️</Text>
          </View>
          <View style={styles.methodTextCol}>
            <Text style={styles.methodTitle}>Email & Password</Text>
            <Text style={styles.methodDesc}>Standard credentials with saved password</Text>
          </View>
          <Text style={styles.methodArrow}>→</Text>
        </Pressable>

        {/* Method 3: Magic Link */}
        <Pressable
          onPress={() => router.push('/magic-link')}
          style={styles.methodCard}
          accessibilityRole="button"
        >
          <View style={[styles.methodIconWrap, styles.magicIconWrap]}>
            <Text style={styles.methodIcon}>🪄</Text>
          </View>
          <View style={styles.methodTextCol}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.methodTitle}>Magic Sign-In Link</Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            </View>
            <Text style={styles.methodDesc}>One-click link sent straight to your inbox</Text>
          </View>
          <Text style={styles.methodArrow}>→</Text>
        </Pressable>

        {/* Method 4: Apple Sign In */}
        <Pressable
          onPress={() => handleSocial('apple')}
          disabled={loadingProvider !== null}
          style={[styles.socialPill, styles.applePill]}
          accessibilityRole="button"
        >
          <Text style={styles.appleLogoIcon}></Text>
          <Text style={styles.applePillText}>
            {loadingProvider === 'apple' ? 'Connecting to Apple…' : 'Continue with Apple'}
          </Text>
        </Pressable>

        {/* Method 5: Google Sign In */}
        <Pressable
          onPress={() => handleSocial('google')}
          disabled={loadingProvider !== null}
          style={[styles.socialPill, styles.googlePill]}
          accessibilityRole="button"
        >
          <Text style={styles.googleIcon}>🌐</Text>
          <Text style={styles.googlePillText}>
            {loadingProvider === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
          </Text>
        </Pressable>
      </View>

      {/* Return to Sign In */}
      <Pressable
        onPress={() => router.push('/sign-in')}
        style={styles.backLink}
        accessibilityRole="link"
      >
        <Text style={styles.backLinkText}>Return to main Sign In</Text>
      </Pressable>
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    padding: space.x3,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#ba1a1a',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  methodsCol: {
    gap: space.x3,
  },
  methodCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x4,
  },
  methodIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  magicIconWrap: {
    backgroundColor: 'rgba(255, 126, 51, 0.12)',
  },
  methodIcon: {
    fontSize: 22,
  },
  methodTextCol: {
    flex: 1,
    gap: 2,
  },
  methodTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  methodTitle: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  popularBadge: {
    backgroundColor: 'rgba(255, 126, 51, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularText: {
    color: color.warm,
    fontSize: 10,
    fontWeight: '800',
  },
  methodDesc: {
    color: color.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  methodArrow: {
    color: color.muted,
    fontSize: 18,
    fontWeight: '800',
  },
  socialPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
  },
  applePill: {
    backgroundColor: '#000000',
  },
  appleLogoIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: space.x2,
  },
  applePillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  googlePill: {
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderWidth: 1,
  },
  googleIcon: {
    fontSize: 16,
    marginRight: space.x2,
  },
  googlePillText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: space.x2,
    paddingVertical: space.x1,
  },
  backLinkText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
