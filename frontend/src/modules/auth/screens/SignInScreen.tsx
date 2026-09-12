import { zodResolver } from '@hookform/resolvers/zod';
import { color, radius, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuthStore } from '@/lib/authStore';
import { type CountryItem, supportedCountries } from '@/modules/auth/authConstants';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AuthSuccessCelebration } from '@/modules/auth/components/AuthSuccessCelebration';
import { InlinePhoneInput } from '@/modules/auth/components/InlinePhoneInput';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const emailSignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type EmailSignInValues = z.infer<typeof emailSignInSchema>;

export function SignInScreen() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Phone OTP States
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(supportedCountries[0]);
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
    formState: { errors },
  } = useForm<EmailSignInValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: { email: '', password: '' },
  });

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

  async function handleEmailSignIn(data: EmailSignInValues) {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signIn(data.email, data.password);
      setShowCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPhoneOtp() {
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
      title="Welcome Back"
      subtitle="Sign in to access verified housing, rides, and Desi community network."
      badgeText="SIGN IN"
      showBack={false}
    >
      {/* Animated Success Celebration Takeover */}
      {showCelebration ? (
        <AuthSuccessCelebration
          userName={user?.user_metadata?.full_name ?? user?.email ?? 'Member'}
          title="Welcome Back! 🎉"
          subtitle="Your verified session is ready. Redirecting you home..."
          onComplete={() => router.replace('/home')}
        />
      ) : null}

      {needsConfirmation ? (
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Check your email</Text>
          <Text style={styles.confirmationBody}>
            A confirmation link has been sent to your email. Tap the link to verify your account,
            then sign in.
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
            Email & Password
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
            Phone OTP
          </Text>
        </Pressable>
      </View>

      {/* Main Form Area with Stabilized Height */}
      <View style={styles.form}>
        <View style={styles.formContentBlock}>
          {authMethod === 'email' ? (
            <>
              {/* Email Input */}
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

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push('/forgot-password')}
                    style={styles.forgot}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputWrapper}>
                      <AppIcon name="lock" size={18} color={color.muted} />
                      <Input className="flex-1 border-0 bg-transparent min-h-12">
                        <InputField
                          placeholder="••••••••"
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
              </View>

              {/* Remember Device Toggle */}
              <View style={styles.rememberRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberDevice }}
                  onPress={() => setRememberDevice(!rememberDevice)}
                  style={styles.rememberCheckRow}
                >
                  <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                    {rememberDevice ? (
                      <AppIcon name="check" size={12} color="#ffffff" strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text style={styles.rememberLabel}>Remember this device</Text>
                </Pressable>
                <View style={styles.trustedBadge}>
                  <AppIcon name="shield" size={12} color={color.teal} />
                  <Text style={styles.trustedText}>Trusted Session</Text>
                </View>
              </View>

              {displayError ? (
                <View style={styles.errorBanner}>
                  <AppIcon name="warning" size={16} color="#ba1a1a" />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}

              <AppButton
                label="Sign In →"
                onPress={handleSubmit(handleEmailSignIn)}
                loading={loading}
              />
            </>
          ) : (
            <>
              {/* Phone Number Input with Embedded Country Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MOBILE PHONE NUMBER</Text>
                <InlinePhoneInput
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                  phoneDigits={phoneDigits}
                  onChangePhoneDigits={(val) => {
                    setPhoneDigits(val);
                    if (displayError) setError(null);
                  }}
                  editable={!otpSent}
                />
              </View>

              {/* OTP Code Step (Inline, No Page Navigation) */}
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
                    label="Verify & Sign In →"
                    onPress={handleVerifyPhoneOtp}
                    loading={loading}
                  />
                </View>
              ) : (
                <>
                  {/* Remember Device Toggle on Phone Tab */}
                  <View style={styles.rememberRow}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: rememberDevice }}
                      onPress={() => setRememberDevice(!rememberDevice)}
                      style={styles.rememberCheckRow}
                    >
                      <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                        {rememberDevice ? (
                          <AppIcon name="check" size={12} color="#ffffff" strokeWidth={3} />
                        ) : null}
                      </View>
                      <Text style={styles.rememberLabel}>Remember this device</Text>
                    </Pressable>
                    <View style={styles.trustedBadge}>
                      <AppIcon name="shield" size={12} color={color.teal} />
                      <Text style={styles.trustedText}>Trusted Session</Text>
                    </View>
                  </View>

                  <View style={styles.phoneTrustPill}>
                    <AppIcon name="shield" size={13} color={color.teal} />
                    <Text style={styles.phoneTrustText}>
                      Instant 6-digit SMS verification • No password needed
                    </Text>
                  </View>

                  <AppButton
                    label="Send Verification Code →"
                    onPress={handleSendPhoneOtp}
                    loading={loading}
                  />
                </>
              )}

              {displayError ? (
                <View style={styles.errorBanner}>
                  <AppIcon name="warning" size={16} color="#ba1a1a" />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* Alternative Logins */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR 1-TAP SOCIAL SIGN IN</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Apple & Google Social Buttons */}
        <View style={styles.socialRow}>
          <Pressable
            onPress={() => handleSocial('apple')}
            style={styles.socialBtnApple}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            <AppIcon name="apple" size={18} color="#ffffff" />
            <Text style={styles.socialAppleText}>Apple</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSocial('google')}
            style={styles.socialBtnGoogle}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <AppIcon name="google" size={18} />
            <Text style={styles.socialGoogleText}>Google</Text>
          </Pressable>
        </View>

        {/* Switch to Sign Up */}
        <View style={styles.registerPromptRow}>
          <Text style={styles.registerPromptText}>Don't have an account? </Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/sign-up')}>
            <Text style={styles.registerLink}>Create Account ›</Text>
          </Pressable>
        </View>
      </View>

      {/* Security Trust Footnote */}
      <View style={styles.securityBadge}>
        <AppIcon name="shield" size={13} color={color.muted} />
        <Text style={styles.securityText}>
          Bank-grade 256-bit encryption • Supabase verified security
        </Text>
      </View>
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
  form: { gap: space.x4 },
  formContentBlock: {
    gap: space.x4,
    justifyContent: 'space-between',
    minHeight: 285,
  },
  inputGroup: { gap: space.x1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  phoneTrustPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.06)',
    borderColor: 'rgba(0, 105, 107, 0.15)',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: space.x3,
    paddingVertical: 8,
  },
  phoneTrustText: {
    color: color.teal,
    fontSize: 12,
    fontWeight: '600',
  },
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
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x1,
  },
  rememberCheckRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  checkbox: {
    alignItems: 'center',
    borderColor: color.border,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  checkboxActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  rememberLabel: { color: color.ink, fontSize: 13, fontWeight: '600' },
  trustedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: space.x2,
    paddingVertical: 2,
  },
  trustedText: { color: color.teal, fontSize: 11, fontWeight: '700' },
  forgot: { paddingVertical: space.x1 },
  forgotText: { color: color.primary, fontSize: 12, fontWeight: '700' },
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
  registerPromptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x1,
  },
  registerPromptText: { color: color.muted, fontSize: 14, fontWeight: '600' },
  registerLink: { color: color.primary, fontSize: 14, fontWeight: '800' },
  securityBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: space.x2,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  securityText: { color: color.muted, fontSize: 11, fontWeight: '600' },
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
});
