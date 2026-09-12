import { zodResolver } from '@hookform/resolvers/zod';
import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useAuthStore } from '@/lib/authStore';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const signUpSchema = z
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

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeError = useAuthStore((s) => s.error);
  const needsConfirmation = useAuthStore((s) => s.needsEmailConfirmation);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
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

  const displayError = error || storeError;

  async function handleSignUp(data: SignUpValues) {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signUp(data.email, data.password, data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.pageContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>←</Text>
            </Pressable>

            <View style={styles.brandBadge}>
              <Image source={welcomeLogo} style={styles.brandEmblem} />
              <Text style={styles.brandBadgeText}>ManaBandhu</Text>
              <View style={styles.verifiedDot}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            </View>

            <View style={styles.topSpacer} />
          </View>

          {/* Hero Section */}
          <View style={styles.authHero}>
            <View style={styles.memberTag}>
              <Text style={styles.memberTagText}>✨ Join 25,000+ Verified Members</Text>
            </View>
            <Text style={styles.authTitle}>Join ManaBandhu 🎉</Text>
            <Text style={styles.authBody}>
              Create your account to connect with trusted community housing, carpools, and job
              referrals.
            </Text>
          </View>

          {needsConfirmation ? (
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationTitle}>Check your email</Text>
              <Text style={styles.confirmationBody}>
                A confirmation link has been sent to your email. Tap the link to verify your
                account, then sign in.
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.leadingIcon}>👤</Text>
                    <Input className="flex-1 border-0 bg-transparent">
                      <InputField
                        placeholder="e.g. Rajesh Koyi"
                        autoComplete="name"
                        accessibilityLabel="Full name"
                        value={value}
                        onChangeText={onChange}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.leadingIcon}>✉</Text>
                    <Input className="flex-1 border-0 bg-transparent">
                      <InputField
                        placeholder="e.g. rajesh@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        accessibilityLabel="Email address"
                        value={value}
                        onChangeText={onChange}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CREATE PASSWORD</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.leadingIcon}>🔒</Text>
                    <Input className="flex-1 border-0 bg-transparent">
                      <InputField
                        placeholder="At least 8 characters"
                        secureTextEntry={!showPassword}
                        accessibilityLabel="Password"
                        value={value}
                        onChangeText={onChange}
                        style={styles.field}
                      />
                    </Input>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeToggle}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                    </Pressable>
                  </View>
                )}
              />
              {/* Password Strength Indicator */}
              {passwordLength > 0 ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          level <= strengthScore &&
                            (strengthScore <= 2 ? styles.barWeak : styles.barStrong),
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.strengthText}>
                    {strengthScore <= 2 ? 'Weak' : strengthScore === 3 ? 'Good' : 'Strong'}
                  </Text>
                </View>
              ) : null}
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password.message}</Text>
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
                    <Text style={styles.leadingIcon}>🛡️</Text>
                    <Input className="flex-1 border-0 bg-transparent">
                      <InputField
                        placeholder="Re-enter your password"
                        secureTextEntry={!showPassword}
                        accessibilityLabel="Confirm password"
                        value={value}
                        onChangeText={onChange}
                        style={styles.field}
                      />
                    </Input>
                  </View>
                )}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              ) : null}
            </View>

            {/* Trust & Safety Banner */}
            <View style={styles.trustBanner}>
              <Text style={styles.trustBannerIcon}>🛡️</Text>
              <View style={styles.trustBannerContent}>
                <Text style={styles.trustBannerTitle}>Verified Community</Text>
                <Text style={styles.trustBannerDesc}>
                  Safe spaces, verified roommates & zero brokerage guaranteed.
                </Text>
              </View>
            </View>

            {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

            <AppButton
              label="Create Account →"
              onPress={handleSubmit(handleSignUp)}
              loading={loading}
            />

            {/* Alternative Auth */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.quickAuthRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/phone-login')}
                style={styles.quickAuthBtn}
              >
                <Text style={styles.quickAuthIcon}>📱</Text>
                <Text style={styles.quickAuthText}>Phone OTP</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/email-login')}
                style={styles.quickAuthBtn}
              >
                <Text style={styles.quickAuthIcon}>✉</Text>
                <Text style={styles.quickAuthText}>Magic Link</Text>
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

          {/* Privacy Note */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              By creating an account, you agree to ManaBandhu Terms of Service & Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: color.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.x4 },
  pageContainer: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    gap: space.x4,
    paddingVertical: space.x2,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x1,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  backIcon: { color: color.ink, fontSize: 18, fontWeight: '700' },
  topSpacer: { width: 38 },
  brandBadge: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x3,
    paddingVertical: 4,
  },
  brandEmblem: { borderRadius: 8, height: 22, width: 22 },
  brandBadgeText: { color: color.primary, fontSize: 14, fontWeight: '800' },
  verifiedDot: {
    alignItems: 'center',
    backgroundColor: color.teal,
    borderRadius: 6,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  verifiedCheck: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  authHero: { alignItems: 'center', gap: space.x2, marginTop: space.x2 },
  memberTag: {
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    borderRadius: 999,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
  },
  memberTagText: { color: color.teal, fontSize: 12, fontWeight: '700' },
  authTitle: {
    color: color.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 38,
    textAlign: 'center',
  },
  authBody: { color: color.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  confirmationBox: {
    backgroundColor: color.primarySoft,
    borderRadius: 16,
    gap: space.x1,
    padding: space.x4,
  },
  confirmationTitle: { color: color.ink, fontSize: 15, fontWeight: '800' },
  confirmationBody: { color: color.muted, fontSize: 13, lineHeight: 19 },
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
  leadingIcon: { fontSize: 16, marginRight: space.x2 },
  field: { color: color.ink, fontSize: 15, fontWeight: '500' },
  eyeToggle: { padding: space.x2 },
  eyeIcon: { fontSize: 16 },
  strengthContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    marginTop: 4,
    paddingHorizontal: space.x1,
  },
  strengthBars: { flexDirection: 'row', flex: 1, gap: 4 },
  strengthBar: {
    backgroundColor: color.border,
    borderRadius: 2,
    flex: 1,
    height: 4,
  },
  barWeak: { backgroundColor: color.warning },
  barStrong: { backgroundColor: color.teal },
  strengthText: { color: color.muted, fontSize: 11, fontWeight: '700' },
  trustBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.06)',
    borderColor: 'rgba(0, 105, 107, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  trustBannerIcon: { fontSize: 24 },
  trustBannerContent: { flex: 1, gap: 2 },
  trustBannerTitle: { color: color.teal, fontSize: 13, fontWeight: '800' },
  trustBannerDesc: { color: color.ink, fontSize: 12, lineHeight: 16 },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x3,
    marginVertical: space.x1,
  },
  dividerLine: { backgroundColor: color.border, flex: 1, height: 1 },
  dividerText: { color: color.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  quickAuthRow: { flexDirection: 'row', gap: space.x3 },
  quickAuthBtn: {
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
  quickAuthIcon: { fontSize: 16 },
  quickAuthText: { color: color.ink, fontSize: 13, fontWeight: '700' },
  loginPromptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x1,
  },
  loginPromptText: { color: color.muted, fontSize: 14, fontWeight: '600' },
  loginLink: { color: color.primary, fontSize: 14, fontWeight: '800' },
  disclaimerContainer: { paddingHorizontal: space.x2, marginTop: space.x1 },
  disclaimerText: {
    color: color.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  errorText: { color: color.error, fontSize: 13, fontWeight: '700' },
});
