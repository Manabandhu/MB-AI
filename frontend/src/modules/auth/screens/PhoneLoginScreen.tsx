import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AuthSuccessCelebration } from '@/modules/auth/components/AuthSuccessCelebration';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function PhoneLoginScreen() {
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(supportedCountries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const storeError = useAuthStore((s) => s.error);

  useEffect(() => {
    if (status === 'authenticated') {
      setShowCelebration(true);
    }
  }, [status]);

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

      {/* Country Code Dropdown Trigger */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>COUNTRY / REGION</Text>
        <Pressable
          onPress={() => setDropdownOpen(true)}
          style={styles.dropdownTrigger}
          accessibilityRole="combobox"
          accessibilityLabel="Select country code"
        >
          <View style={styles.dropdownTriggerLeft}>
            <Text style={styles.flagText}>{selectedCountry.flag}</Text>
            <Text style={styles.countryNameText}>{selectedCountry.name}</Text>
            <Text style={styles.countryCodeBadge}>{selectedCountry.code}</Text>
          </View>
          <AppIcon name="chevron-down" size={18} color={color.muted} />
        </Pressable>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDropdownOpen(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <Pressable
                onPress={() => setDropdownOpen(false)}
                accessibilityRole="button"
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} bounces={false}>
              {supportedCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      setSelectedCountry(c);
                      setDropdownOpen(false);
                    }}
                    style={[styles.countryOption, isSelected && styles.countryOptionSelected]}
                    accessibilityRole="button"
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionFlag}>{c.flag}</Text>
                      <Text style={[styles.optionName, isSelected && styles.optionTextSelected]}>
                        {c.name}
                      </Text>
                    </View>
                    <View style={styles.optionRight}>
                      <Text style={[styles.optionCode, isSelected && styles.optionTextSelected]}>
                        {c.code}
                      </Text>
                      {isSelected ? (
                        <AppIcon name="check" size={16} color={color.primary} strokeWidth={3} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Phone Number Input with Gluestack */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
        <View style={styles.phoneInputRow}>
          <View style={styles.phonePrefixPill}>
            <Text style={styles.prefixFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.prefixText}>{selectedCountry.code}</Text>
          </View>
          <Input className="flex-1 border-0 bg-transparent min-h-12">
            <InputField
              placeholder="(555) 000-0000"
              keyboardType="phone-pad"
              value={phoneDigits}
              onChangeText={(val) => {
                setPhoneDigits(val);
                if (error) setLocalError(null);
              }}
              accessibilityLabel="Mobile phone number"
              style={styles.phoneField}
            />
          </Input>
        </View>
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
  dropdownTrigger: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: space.x3,
  },
  dropdownTriggerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  flagText: {
    fontSize: 18,
  },
  countryNameText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  countryCodeBadge: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 6,
    color: color.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  // Modal Dropdown
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxHeight: 400,
    maxWidth: 440,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: color.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  modalTitle: {
    color: color.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: space.x1,
  },
  modalCloseText: {
    color: color.muted,
    fontSize: 16,
    fontWeight: '800',
  },
  modalScroll: {
    maxHeight: 320,
  },
  countryOption: {
    alignItems: 'center',
    borderBottomColor: 'rgba(0,0,0,0.04)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  countryOptionSelected: {
    backgroundColor: 'rgba(67, 30, 190, 0.06)',
  },
  optionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
  },
  optionFlag: {
    fontSize: 20,
  },
  optionName: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  optionRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  optionCode: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: color.primary,
    fontWeight: '800',
  },
  // Phone Input Row with Gluestack
  phoneInputRow: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: space.x2,
  },
  phonePrefixPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: space.x2,
    paddingVertical: 6,
  },
  prefixFlag: {
    fontSize: 14,
  },
  prefixText: {
    color: color.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  phoneField: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: space.x2,
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
