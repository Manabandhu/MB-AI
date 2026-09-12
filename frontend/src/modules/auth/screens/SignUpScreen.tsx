import { zodResolver } from '@hookform/resolvers/zod';
import { color, radius, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuthStore } from '@/lib/authStore';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AuthSuccessCelebration } from '@/modules/auth/components/AuthSuccessCelebration';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const emailSignUpSchema = z
  .object({
    name: z.string().min(1, 'Full name is required').max(120),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type EmailSignUpValues = z.infer<typeof emailSignUpSchema>;

export function SignUpScreen() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Phone Sign-Up States
  const [phoneName, setPhoneName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(supportedCountries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timerCount, setTimerCount] = useState(60);

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const storeError = useAuthStore((s) => s.error);
  const needsConfirmation = useAuthStore((s) => s.needsEmailConfirmation);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmailSignUpValues>({
    resolver: zodResolver(emailSignUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');
  const passwordLength = passwordValue?.length || 0;
  const hasNumber = /\d/.test(passwordValue || '');
  const hasUpper = /[A-Z]/.test(passwordValue || '');
  const strengthScore =
    (passwordLength >= 8 ? 1 : 0) +
    (passwordLength >= 10 ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasUpper ? 1 : 0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (otpSent && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timerCount]);

  // Trigger celebration on authenticated state
  useEffect(() => {
    if (status === 'authenticated') {
      setShowCelebration(true);
    }
  }, [status]);

  async function handleEmailSignUp(data: EmailSignUpValues) {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signUp(data.email, data.password, data.name);
      if (!useAuthStore.getState().needsEmailConfirmation) {
        setShowCelebration(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPhoneOtp() {
    if (!phoneName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const trimmed = phoneDigits.trim();
    if (!trimmed || trimmed.length < 7) {
      setError('Please enter a valid mobile phone number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fullPhone = `${selectedCountry.code}${trimmed.replace(/\D/g, '')}`;
      await useAuthStore.getState().signInWithPhone(fullPhone);
      setOtpSent(true);
      setTimerCount(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPhoneOtp() {
    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fullPhone = `${selectedCountry.code}${phoneDigits.trim().replace(/\D/g, '')}`;
      await useAuthStore.getState().verifyOtp(fullPhone, trimmedOtp, 'sms');
      setShowCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: 'apple' | 'google') {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signInWithOAuth(provider);
      setShowCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  }

  const displayError = error || storeError;

  return (
    <AuthPageLayout
      title="Join ManaBandhu"
      subtitle="Create your verified account to connect with Desi rooms, carpools & jobs."
      badgeText="50,000+ Verified Members"
      backHref="/sign-in"
    >
      {/* Animated Success Celebration Takeover */}
      {showCelebration ? (
        <AuthSuccessCelebration
          userName={user?.user_metadata?.full_name ?? user?.email ?? phoneName ?? 'Member'}
          title="Welcome to the Community! 🎉"
          subtitle="Your verified profile is activated. Let's take you home..."
          onComplete={() => router.replace('/home')}
        />
      ) : null}

      {needsConfirmation ? (
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Check your inbox</Text>
          <Text style={styles.confirmationBody}>
            We've sent a verification email. Click the confirmation link to activate your account!
          </Text>
        </View>
      ) : null}

      {/* Segmented Auth Method Switcher */}
      <View style={styles.segmentedContainer}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: authMethod === 'email' }}
          onPress={() => {
            setAuthMethod('email');
            setError(null);
          }}
          style={[styles.segmentBtn, authMethod === 'email' && styles.segmentBtnActive]}
        >
          <AppIcon
            name="mail"
            size={15}
            color={authMethod === 'email' ? color.primary : color.muted}
          />
          <Text
            style={[styles.segmentBtnText, authMethod === 'email' && styles.segmentBtnTextActive]}
          >
            Email Sign Up
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: authMethod === 'phone' }}
          onPress={() => {
            setAuthMethod('phone');
            setError(null);
          }}
          style={[styles.segmentBtn, authMethod === 'phone' && styles.segmentBtnActive]}
        >
          <AppIcon
            name="phone"
            size={15}
            color={authMethod === 'phone' ? color.primary : color.muted}
          />
          <Text
            style={[styles.segmentBtnText, authMethod === 'phone' && styles.segmentBtnTextActive]}
          >
            Phone OTP Sign Up
          </Text>
        </Pressable>
      </View>

      {/* Main Form Fields */}
      <View style={styles.form}>
        {authMethod === 'email' ? (
          <>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <AppIcon name="user" size={18} color={color.muted} />
                    <Input className="flex-1 border-0 bg-transparent min-h-12">
                      <InputField
                        placeholder="e.g. Priya Sharma"
                        accessibilityLabel="Full name"
                        value={value}
                        onChangeText={(val) => {
                          onChange(val);
                          if (displayError) setError(null);
                        }}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.name ? (
                <Text style={styles.fieldErrorText}>{errors.name.message}</Text>
              ) : null}
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <AppIcon name="mail" size={18} color={color.muted} />
                    <Input className="flex-1 border-0 bg-transparent min-h-12">
                      <InputField
                        placeholder="name@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        accessibilityLabel="Email address"
                        value={value}
                        onChangeText={(val) => {
                          onChange(val);
                          if (displayError) setError(null);
                        }}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.email ? (
                <Text style={styles.fieldErrorText}>{errors.email.message}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CREATE PASSWORD</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <AppIcon name="lock" size={18} color={color.muted} />
                    <Input className="flex-1 border-0 bg-transparent min-h-12">
                      <InputField
                        placeholder="Min 8 characters"
                        secureTextEntry={!showPassword}
                        accessibilityLabel="Password"
                        value={value}
                        onChangeText={(val) => {
                          onChange(val);
                          if (displayError) setError(null);
                        }}
                        style={styles.field}
                      />
                    </Input>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeToggle}
                    >
                      <AppIcon
                        name={showPassword ? 'eye-closed' : 'eye'}
                        size={18}
                        color={color.muted}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.password ? (
                <Text style={styles.fieldErrorText}>{errors.password.message}</Text>
              ) : null}

              {/* Dynamic 4-Bar Password Strength Meter */}
              {passwordLength > 0 ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarsRow}>
                    <View
                      style={[
                        styles.strengthBar,
                        strengthScore >= 1 && {
                          backgroundColor:
                            strengthScore === 1
                              ? '#ba1a1a'
                              : strengthScore === 2
                                ? '#e28743'
                                : color.teal,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        strengthScore >= 2 && {
                          backgroundColor: strengthScore === 2 ? '#e28743' : color.teal,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        strengthScore >= 3 && { backgroundColor: color.teal },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        strengthScore >= 4 && { backgroundColor: color.teal },
                      ]}
                    />
                  </View>
                  <Text style={styles.strengthLabel}>
                    {strengthScore <= 1
                      ? 'Weak'
                      : strengthScore === 2
                        ? 'Fair'
                        : strengthScore === 3
                          ? 'Good'
                          : 'Strong'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <AppIcon name="lock" size={18} color={color.muted} />
                    <Input className="flex-1 border-0 bg-transparent min-h-12">
                      <InputField
                        placeholder="Re-enter password"
                        secureTextEntry={!showPassword}
                        accessibilityLabel="Confirm password"
                        value={value}
                        onChangeText={(val) => {
                          onChange(val);
                          if (displayError) setError(null);
                        }}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.confirmPassword ? (
                <Text style={styles.fieldErrorText}>{errors.confirmPassword.message}</Text>
              ) : null}
            </View>

            {displayError ? (
              <View style={styles.errorBanner}>
                <AppIcon name="warning" size={16} color="#ba1a1a" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            <AppButton
              label="Create Free Account →"
              onPress={handleSubmit(handleEmailSignUp)}
              loading={loading}
            />
          </>
        ) : (
          <>
            {/* Phone Sign Up Form */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <AppIcon name="user" size={18} color={color.muted} />
                <Input className="flex-1 border-0 bg-transparent min-h-12">
                  <InputField
                    placeholder="e.g. Rajesh Reddy"
                    accessibilityLabel="Your full name"
                    value={phoneName}
                    onChangeText={(val) => {
                      setPhoneName(val);
                      if (displayError) setError(null);
                    }}
                    editable={!otpSent}
                    style={styles.field}
                  />
                </Input>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE PHONE NUMBER</Text>

              {/* Country Code Dropdown Trigger */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select country dialing code"
                onPress={() => setDropdownOpen(true)}
                style={styles.countryDropdownTrigger}
              >
                <View style={styles.countryTriggerLeft}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryName} numberOfLines={1}>
                    {selectedCountry.name}
                  </Text>
                </View>
                <View style={styles.countryTriggerRight}>
                  <Text style={styles.countryCodeBadge}>{selectedCountry.code}</Text>
                  <AppIcon name="chevron-down" size={16} color={color.muted} />
                </View>
              </Pressable>

              {/* Phone Input with Country Prefix */}
              <View style={styles.inputWrapper}>
                <View style={styles.countryPrefixBadge}>
                  <Text style={styles.countryPrefixText}>{selectedCountry.code}</Text>
                </View>
                <Input className="flex-1 border-0 bg-transparent min-h-12">
                  <InputField
                    placeholder="(555) 000-0000"
                    keyboardType="phone-pad"
                    accessibilityLabel="Mobile phone number"
                    value={phoneDigits}
                    onChangeText={(val) => {
                      setPhoneDigits(val);
                      if (displayError) setError(null);
                    }}
                    editable={!otpSent}
                    style={styles.field}
                  />
                </Input>
                <AppIcon name="phone" size={18} color={color.muted} />
              </View>
            </View>

            {/* OTP Code Input Step */}
            {otpSent ? (
              <View style={styles.otpCard}>
                <View style={styles.otpHeaderRow}>
                  <View style={styles.otpHeaderTitleRow}>
                    <AppIcon name="shield" size={16} color={color.teal} />
                    <Text style={styles.otpCardTitle}>Enter 6-Digit Code</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    style={styles.editPhoneBtn}
                  >
                    <Text style={styles.editPhoneText}>Edit Phone</Text>
                  </Pressable>
                </View>

                <View style={styles.otpInputWrapper}>
                  <Input className="flex-1 border-0 bg-transparent min-h-12">
                    <InputField
                      placeholder="• • • • • •"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      accessibilityLabel="6-digit verification code"
                      value={otpCode}
                      onChangeText={(val) => {
                        setOtpCode(val);
                        if (displayError) setError(null);
                      }}
                      style={styles.otpField}
                    />
                  </Input>
                </View>

                <View style={styles.otpResendRow}>
                  {timerCount > 0 ? (
                    <Text style={styles.timerText}>Resend code in {timerCount}s</Text>
                  ) : (
                    <Pressable onPress={handleSendPhoneOtp} disabled={loading}>
                      <Text style={styles.resendAction}>Resend verification code</Text>
                    </Pressable>
                  )}
                </View>

                <AppButton
                  label="Verify & Join ManaBandhu →"
                  onPress={handleVerifyPhoneOtp}
                  loading={loading}
                />
              </View>
            ) : (
              <AppButton
                label="Send Verification Code →"
                onPress={handleSendPhoneOtp}
                loading={loading}
              />
            )}

            {displayError ? (
              <View style={styles.errorBanner}>
                <AppIcon name="warning" size={16} color="#ba1a1a" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* Alternative Sign-Ups */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR 1-TAP SOCIAL SIGN UP</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Apple & Google Social Buttons */}
        <View style={styles.socialRow}>
          <Pressable
            onPress={() => handleSocial('apple')}
            style={styles.socialBtnApple}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Apple"
          >
            <AppIcon name="apple" size={18} color="#ffffff" />
            <Text style={styles.socialAppleText}>Apple</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSocial('google')}
            style={styles.socialBtnGoogle}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Google"
          >
            <AppIcon name="google" size={18} />
            <Text style={styles.socialGoogleText}>Google</Text>
          </Pressable>
        </View>

        {/* Switch to Sign In */}
        <View style={styles.loginPromptRow}>
          <Text style={styles.loginPromptText}>Already have an account? </Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/sign-in')}>
            <Text style={styles.loginLink}>Sign In ›</Text>
          </Pressable>
        </View>
      </View>

      {/* Community Protection Banner */}
      <View style={styles.communitySafetyBanner}>
        <AppIcon name="shield" size={18} color={color.teal} />
        <View style={styles.communitySafetyCol}>
          <Text style={styles.communitySafetyTitle}>Trusted Desi Community</Text>
          <Text style={styles.communitySafetyDesc}>
            All members are verified to ensure safe roommates, friendly carpools, and genuine
            referrals.
          </Text>
        </View>
      </View>

      {/* Country Code Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={dropdownOpen}
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDropdownOpen(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Country Code</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close country selection"
                onPress={() => setDropdownOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.countryList} bounces={false}>
              {supportedCountries.map((c) => {
                const isSelected = selectedCountry.code === c.code;
                return (
                  <Pressable
                    key={c.code + c.name}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedCountry(c);
                      setDropdownOpen(false);
                    }}
                    style={[styles.countryItemRow, isSelected && styles.countryItemRowSelected]}
                  >
                    <View style={styles.countryItemLeft}>
                      <Text style={styles.countryItemFlag}>{c.flag}</Text>
                      <Text style={styles.countryItemName}>{c.name}</Text>
                    </View>
                    <View style={styles.countryItemRight}>
                      <Text style={styles.countryItemCode}>{c.code}</Text>
                      {isSelected ? (
                        <AppIcon name="check" size={16} color={color.teal} strokeWidth={3} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  confirmationBox: {
    backgroundColor: color.primarySoft,
    borderRadius: 16,
    gap: space.x1,
    padding: space.x4,
  },
  confirmationTitle: { color: color.ink, fontSize: 15, fontWeight: '800' },
  confirmationBody: { color: color.muted, fontSize: 13, lineHeight: 19 },
  segmentedContainer: {
    backgroundColor: 'rgba(67, 30, 190, 0.06)',
    borderRadius: 14,
    flexDirection: 'row',
    padding: 3,
  },
  segmentBtn: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentBtnText: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: color.ink,
  },
  form: { gap: space.x3 },
  inputGroup: { gap: space.x1 },
  inputLabel: { color: color.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: space.x3,
  },
  field: { color: color.ink, fontSize: 15, fontWeight: '500', paddingHorizontal: space.x2 },
  fieldErrorText: { color: '#ba1a1a', fontSize: 12, fontWeight: '600', marginTop: 2 },
  eyeToggle: { padding: space.x2 },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: space.x3,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  strengthLabel: {
    color: color.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  countryDropdownTrigger: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.04)',
    borderColor: color.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.x1,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  countryTriggerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: space.x2,
  },
  countryFlag: { fontSize: 18 },
  countryName: { color: color.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  countryTriggerRight: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  countryCodeBadge: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    borderRadius: radius.pill,
    color: color.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: space.x2,
    paddingVertical: 2,
  },
  countryPrefixBadge: {
    borderRightColor: color.border,
    borderRightWidth: 1,
    paddingRight: space.x2,
  },
  countryPrefixText: { color: color.primary, fontSize: 14, fontWeight: '800' },
  otpCard: {
    backgroundColor: 'rgba(0, 105, 107, 0.04)',
    borderColor: 'rgba(0, 105, 107, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  otpHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpHeaderTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  otpCardTitle: {
    color: color.teal,
    fontSize: 14,
    fontWeight: '800',
  },
  editPhoneBtn: { padding: 4 },
  editPhoneText: { color: color.primary, fontSize: 12, fontWeight: '700' },
  otpInputWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: color.teal,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: space.x3,
  },
  otpField: {
    color: color.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  otpResendRow: { alignItems: 'center', justifyContent: 'center' },
  timerText: { color: color.muted, fontSize: 12, fontWeight: '600' },
  resendAction: { color: color.primary, fontSize: 13, fontWeight: '700' },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
    marginVertical: space.x1,
  },
  dividerLine: { backgroundColor: color.border, flex: 1, height: 1 },
  dividerText: { color: color.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  socialRow: {
    flexDirection: 'row',
    gap: space.x3,
  },
  socialBtnApple: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    minHeight: 46,
  },
  socialAppleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  socialBtnGoogle: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    minHeight: 46,
  },
  socialGoogleText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  loginPromptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x1,
  },
  loginPromptText: { color: color.muted, fontSize: 14, fontWeight: '600' },
  loginLink: { color: color.primary, fontSize: 14, fontWeight: '800' },
  communitySafetyBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.06)',
    borderColor: 'rgba(0, 105, 107, 0.16)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  communitySafetyCol: { flex: 1, gap: 2 },
  communitySafetyTitle: { color: color.teal, fontSize: 13, fontWeight: '800' },
  communitySafetyDesc: { color: color.muted, fontSize: 12, lineHeight: 16 },
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
  errorText: { color: '#ba1a1a', fontSize: 13, fontWeight: '700' },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    elevation: 10,
    maxHeight: 480,
    maxWidth: 420,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
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
  modalTitle: { color: color.ink, fontSize: 16, fontWeight: '800' },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: color.primarySoft,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  modalCloseText: { color: color.primary, fontSize: 13, fontWeight: '700' },
  countryList: { maxHeight: 380 },
  countryItemRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(0,0,0,0.04)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  countryItemRowSelected: { backgroundColor: 'rgba(0, 105, 107, 0.08)' },
  countryItemLeft: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  countryItemFlag: { fontSize: 20 },
  countryItemName: { color: color.ink, fontSize: 14, fontWeight: '600' },
  countryItemRight: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  countryItemCode: { color: color.primary, fontSize: 13, fontWeight: '700' },
});
