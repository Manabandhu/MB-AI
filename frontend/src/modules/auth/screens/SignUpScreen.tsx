import { zodResolver } from '@hookform/resolvers/zod';
import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
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

  async function handleSocial(provider: 'apple' | 'google') {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Join ManaBandhu 🤝"
      subtitle="Create your verified account to connect with Telugu rooms, carpools & jobs."
      badgeText="✨ 50,000+ Verified Members"
      backHref="/sign-in"
    >
      {needsConfirmation ? (
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Check your inbox</Text>
          <Text style={styles.confirmationBody}>
            We've sent a verification email. Click the confirmation link to activate your account!
          </Text>
        </View>
      ) : null}

      {/* Form Fields */}
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
                    placeholder="e.g. Rajesh Reddy"
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
          {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
        </View>

        {/* Email Address */}
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
                    placeholder="Minimum 8 characters"
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
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggle}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </Pressable>
              </View>
            )}
          />

          {/* Dynamic Password Strength Meter */}
          {passwordLength > 0 ? (
            <View style={styles.strengthBlock}>
              <View style={styles.strengthMeterRow}>
                {[1, 2, 3, 4].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.strengthBar,
                      bar <= strengthScore && {
                        backgroundColor:
                          strengthScore <= 1
                            ? '#ba1a1a'
                            : strengthScore === 2
                              ? '#ff7e33'
                              : strengthScore === 3
                                ? color.primary
                                : color.teal,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.strengthText}>
                {strengthScore <= 1
                  ? 'Weak — Use 8+ characters with uppercase and numbers'
                  : strengthScore === 2
                    ? 'Fair — Add numbers or symbols'
                    : strengthScore === 3
                      ? 'Good password'
                      : 'Strong password 💪'}
              </Text>
            </View>
          ) : null}

          {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputWrapper}>
                <Text style={styles.leadingIcon}>🔒</Text>
                <Input className="flex-1 border-0 bg-transparent">
                  <InputField
                    placeholder="Re-enter password"
                    secureTextEntry={!showPassword}
                    accessibilityLabel="Confirm Password"
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
            <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
          ) : null}
        </View>

        {/* Safety Callout */}
        <View style={styles.safetyBox}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>
            ManaBandhu is a spam-free, verified network. Your contact details are never shared
            without your explicit permission.
          </Text>
        </View>

        {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

        <AppButton
          label="Create Account →"
          onPress={handleSubmit(handleSignUp)}
          loading={loading}
        />

        {/* Alternative Logins */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
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
            <Text style={styles.socialAppleText}> Apple</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSocial('google')}
            style={styles.socialBtnGoogle}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Text style={styles.socialGoogleText}>🌐 Google</Text>
          </Pressable>
        </View>

        {/* Quick Auth Options */}
        <View style={styles.quickAuthRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/phone-login')}
            style={styles.quickAuthBtn}
          >
            <Text style={styles.quickAuthIcon}>📱</Text>
            <Text style={styles.quickAuthText}>Phone Sign Up</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/magic-link')}
            style={styles.quickAuthBtn}
          >
            <Text style={styles.quickAuthIcon}>🪄</Text>
            <Text style={styles.quickAuthText}>Magic Link</Text>
          </Pressable>
        </View>

        {/* Already have an account? Sign In */}
        <View style={styles.signInPromptRow}>
          <Text style={styles.signInPromptText}>Already have an account? </Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/sign-in')}>
            <Text style={styles.signInLink}>Sign In ›</Text>
          </Pressable>
        </View>
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
  form: { gap: space.x4 },
  inputGroup: { gap: space.x1 },
  inputLabel: { color: color.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: space.x3,
  },
  leadingIcon: { fontSize: 16, marginRight: space.x2 },
  field: { color: color.ink, fontSize: 15, fontWeight: '500' },
  eyeToggle: { padding: space.x2 },
  eyeIcon: { fontSize: 16 },
  strengthBlock: { gap: 4, marginTop: 4 },
  strengthMeterRow: { flexDirection: 'row', gap: 4, height: 4 },
  strengthBar: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    flex: 1,
  },
  strengthText: { color: color.muted, fontSize: 11, fontWeight: '600' },
  safetyBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 107, 0.06)',
    borderColor: 'rgba(0, 105, 107, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    padding: space.x3,
  },
  safetyIcon: { fontSize: 18 },
  safetyText: { color: color.ink, flex: 1, fontSize: 12, lineHeight: 17 },
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
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  socialGoogleText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
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
  signInPromptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x1,
  },
  signInPromptText: { color: color.muted, fontSize: 14, fontWeight: '600' },
  signInLink: { color: color.primary, fontSize: 14, fontWeight: '800' },
  errorText: { color: color.error, fontSize: 13, fontWeight: '700' },
});
