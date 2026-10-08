import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AuthSuccessCelebration } from '@/modules/auth/components/AuthSuccessCelebration';
import { InlinePhoneInput } from '@/modules/auth/components/InlinePhoneInput';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

export function PhoneLoginScreen() {
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(supportedCountries[0]);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const storeError = useAuthStore((s) => s.error);

  useEffect(() => {
    if (status === 'authenticated' && !localError && !storeError && user) {
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }
  }, [status, localError, storeError, user]);

  async function handleSendCode() {
    const trimmed = phoneDigits.trim();
    if (!trimmed) {
      setLocalError('Please enter your mobile phone number.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      const fullPhone = `${selectedCountry.code}${trimmed.replace(/\D/g, '')}`;
      await useAuthStore.getState().signInWithPhone(fullPhone);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title="Phone Sign In"
      subtitle="Enter your mobile number to receive a 6-digit verification code"
      badgeText="Fast & Secure Mobile Login"
      backHref="/sign-in"
    >
      {showCelebration ? (
        <AuthSuccessCelebration
          userName={user?.user_metadata?.full_name ?? user?.email ?? 'Member'}
          title="Welcome Back! 🎉"
          subtitle="Your verified session is ready. Redirecting you home..."
          onComplete={() => router.replace('/home')}
        />
      ) : null}

      {/* Mobile Phone Number Input with Embedded Country Dropdown */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>MOBILE PHONE NUMBER</Text>
        <InlinePhoneInput
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          phoneDigits={phoneDigits}
          onChangePhoneDigits={(val) => {
            setPhoneDigits(val);
            if (error) setLocalError(null);
          }}
        />
        <Text style={styles.helperText}>
          We will send an SMS with a one-time verification code. Standard carrier rates may apply.
        </Text>
      </View>

      {/* Inline Error Banner with exact AppIcon */}
      {error ? (
        <View style={styles.errorBanner}>
          <AppIcon name="warning" size={16} color="#ba1a1a" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Send Code CTA using Gluestack AppButton */}
      <AppButton
        label={loading ? 'Sending Verification Code…' : 'Send Code →'}
        onPress={handleSendCode}
        loading={loading}
      />

      {/* Alternative Auth Switch (Email & Password) */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or switch to</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        onPress={() => router.push('/email-login')}
        style={styles.altButton}
        accessibilityRole="button"
      >
        <AppIcon name="mail" size={16} color={color.primary} />
        <Text style={styles.altButtonText}>Continue with Email & Password</Text>
      </Pressable>

      {/* Return to Sign In */}
      <Pressable
        onPress={() => router.push('/sign-in')}
        style={styles.backLink}
        accessibilityRole="link"
      >
        <Text style={styles.backLinkText}>Return to main Sign In options</Text>
      </Pressable>
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: space.x2,
  },
  inputLabel: {
    color: color.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  helperText: {
    color: color.muted,
    fontSize: 12,
    lineHeight: 17,
  },
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
  errorText: {
    color: '#ba1a1a',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
    marginVertical: space.x1,
  },
  dividerLine: {
    backgroundColor: color.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: color.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  altButton: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    minHeight: 48,
  },
  altButtonText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: space.x1,
    paddingVertical: space.x1,
  },
  backLinkText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
