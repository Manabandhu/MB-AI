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

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storeError = useAuthStore((s) => s.error);
  const needsConfirmation = useAuthStore((s) => s.needsEmailConfirmation);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  async function handleSignIn(data: SignInValues) {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().signIn(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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

  const displayError = error || storeError;

  return (
    <AuthPageLayout
      title="Welcome Back 👋"
      subtitle="Sign in to access your trusted rooms, rides, jobs, and community network."
      badgeText="Trusted Community Network"
      backHref="/welcome"
    >
      {needsConfirmation ? (
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Check your email</Text>
          <Text style={styles.confirmationBody}>
            A confirmation link has been sent to your email. Tap the link to verify your account,
            then sign in.
          </Text>
        </View>
      ) : null}

      {/* Form */}
      <View style={styles.form}>
        {/* Email Input */}
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
                <Text style={styles.leadingIcon}>🔒</Text>
                <Input className="flex-1 border-0 bg-transparent">
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
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </Pressable>
              </View>
            )}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
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
              {rememberDevice ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.rememberLabel}>Remember this device</Text>
          </Pressable>
          <View style={styles.trustedBadge}>
            <Text style={styles.trustedText}>🛡️ Trusted Session</Text>
          </View>
        </View>

        {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

        <AppButton label="Sign In →" onPress={handleSubmit(handleSignIn)} loading={loading} />

        {/* Alternative Logins */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
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

        {/* Quick Auth: Phone & Magic Link */}
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
            onPress={() => router.push('/magic-link')}
            style={styles.quickAuthBtn}
          >
            <Text style={styles.quickAuthIcon}>🪄</Text>
            <Text style={styles.quickAuthText}>Magic Link</Text>
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
        <Text style={styles.securityText}>
          🔒 Bank-grade 256-bit encryption • Supabase verified security
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
  form: { gap: space.x4 },
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
    minHeight: 54,
    paddingHorizontal: space.x3,
  },
  leadingIcon: { fontSize: 16, marginRight: space.x2 },
  field: { color: color.ink, fontSize: 15, fontWeight: '500' },
  eyeToggle: { padding: space.x2 },
  eyeIcon: { fontSize: 16 },
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
  checkMark: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  rememberLabel: { color: color.ink, fontSize: 13, fontWeight: '600' },
  trustedBadge: {
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    borderRadius: 999,
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
    marginTop: space.x2,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  securityText: { color: color.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  errorText: { color: color.error, fontSize: 13, fontWeight: '700' },
});
