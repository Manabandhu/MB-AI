import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';

const countryCodes = [
  { code: '+1', label: '🇺🇸 US / 🇨🇦 CA' },
  { code: '+91', label: '🇮🇳 India' },
  { code: '+44', label: '🇬🇧 UK' },
  { code: '+61', label: '🇦🇺 Australia' },
];

export function PhoneLoginScreen() {
  const [selectedCountry, setSelectedCountry] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const storeError = useAuthStore((s) => s.error);

  async function handleSendCode() {
    const trimmed = phoneDigits.trim();
    if (!trimmed) {
      setLocalError('Please enter your mobile phone number.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      const fullPhone = `${selectedCountry}${trimmed.replace(/\D/g, '')}`;
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
      subtitle="Enter your phone number to receive a 6-digit verification code"
      badgeText="📱 Fast & Secure Mobile Login"
      backHref="/sign-in"
    >
      {/* Country Code Selector Chips */}
      <View style={styles.countryGroup}>
        <Text style={styles.inputLabel}>Select Country Code</Text>
        <View style={styles.countryChipsRow}>
          {countryCodes.map((c) => {
            const isSelected = c.code === selectedCountry;
            return (
              <Pressable
                key={c.code}
                onPress={() => setSelectedCountry(c.code)}
                style={[styles.countryChip, isSelected && styles.countryChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${c.label}`}
              >
                <Text style={[styles.countryChipText, isSelected && styles.countryChipTextActive]}>
                  {c.label} ({c.code})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Mobile Phone Number</Text>
        <View style={styles.phoneInputRow}>
          <View style={styles.phonePrefixBadge}>
            <Text style={styles.phonePrefixText}>{selectedCountry}</Text>
          </View>
          <TextInput
            placeholder="(555) 000-0000"
            placeholderTextColor={color.muted}
            keyboardType="phone-pad"
            value={phoneDigits}
            onChangeText={(val) => {
              setPhoneDigits(val);
              if (error) setLocalError(null);
            }}
            style={styles.phoneInput}
            accessibilityLabel="Phone Number Input"
          />
        </View>
        <Text style={styles.helperText}>
          We will send an SMS with a one-time verification code. Standard carrier rates may apply.
        </Text>
      </View>

      {/* Inline Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Send Code CTA */}
      <Pressable
        onPress={handleSendCode}
        disabled={loading}
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Sending Verification Code…' : 'Send Code →'}
        </Text>
      </Pressable>

      {/* Alternative Auth Links */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or switch to</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.altButtonsCol}>
        <Pressable
          onPress={() => router.push('/email-login')}
          style={styles.altButton}
          accessibilityRole="button"
        >
          <Text style={styles.altButtonText}>✉️ Continue with Email & Password</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/magic-link')}
          style={styles.altButton}
          accessibilityRole="button"
        >
          <Text style={styles.altButtonText}>🪄 Instant Magic Link</Text>
        </Pressable>
      </View>

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
  countryGroup: {
    gap: space.x2,
  },
  countryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x2,
  },
  countryChip: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  countryChipActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  countryChipText: {
    color: color.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  countryChipTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    gap: space.x2,
  },
  inputLabel: {
    color: color.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  phoneInputRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    overflow: 'hidden',
    paddingHorizontal: space.x2,
  },
  phonePrefixBadge: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 8,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  phonePrefixText: {
    color: color.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  phoneInput: {
    color: color.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
    paddingHorizontal: space.x3,
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
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#ba1a1a',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: color.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
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
  altButtonsCol: {
    gap: space.x2,
  },
  altButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingVertical: space.x3,
  },
  altButtonText: {
    color: color.ink,
    fontSize: 13,
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
