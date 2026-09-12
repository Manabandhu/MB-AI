import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AuthSuccessCelebration } from '@/modules/auth/components/AuthSuccessCelebration';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
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

  async function handleEmailSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().signIn(trimmedEmail, password);
      setShowCelebration(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignIn(provider: 'apple' | 'google') {
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().signInWithOAuth(provider);
      setShowCelebration(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `${provider} sign-in failed`;
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title="Email Sign In"
      subtitle="Sign in with your email address and password"
      badgeText="Email & Password Authentication"
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
      {/* Email Input using Gluestack */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <View style={styles.textInputRow}>
          <AppIcon name="mail" size={18} color={color.muted} />
          <Input className="flex-1 border-0 bg-transparent min-h-12">
            <InputField
              placeholder="you@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setLocalError(null);
              }}
              accessibilityLabel="Email Address Input"
              style={styles.field}
            />
          </Input>
        </View>
      </View>

      {/* Password Input using Gluestack */}
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <Pressable onPress={() => router.push('/forgot-password')} accessibilityRole="link">
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </Pressable>
        </View>
        <View style={styles.textInputRow}>
          <AppIcon name="lock" size={18} color={color.muted} />
          <Input className="flex-1 border-0 bg-transparent min-h-12">
            <InputField
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setLocalError(null);
              }}
              accessibilityLabel="Password Input"
              style={styles.field}
            />
          </Input>
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <AppIcon name={showPassword ? 'eye-closed' : 'eye'} size={18} color={color.muted} />
          </Pressable>
        </View>
      </View>

      {/* Remember Device Checkbox */}
      <Pressable
        onPress={() => setRememberDevice(!rememberDevice)}
        style={styles.rememberRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberDevice }}
      >
        <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
          {rememberDevice ? (
            <AppIcon name="check" size={12} color="#ffffff" strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.rememberText}>Remember this device for 30 days</Text>
      </Pressable>

      {/* Inline Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <AppIcon name="warning" size={16} color="#ba1a1a" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Primary Sign In Button via Gluestack AppButton */}
      <AppButton
        label={loading ? 'Authenticating…' : 'Sign In with Email →'}
        onPress={handleEmailSignIn}
        loading={loading}
      />

      {/* Social Auth Providers */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtonsCol}>
        {/* Apple Sign In */}
        <Pressable
          onPress={() => handleSocialSignIn('apple')}
          disabled={loading}
          style={styles.appleButton}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
        >
          <AppIcon name="apple" size={20} color="#ffffff" />
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </Pressable>

        {/* Google Sign In */}
        <Pressable
          onPress={() => handleSocialSignIn('google')}
          disabled={loading}
          style={styles.googleButton}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          <AppIcon name="google" size={18} color="#ea4335" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>
      </View>

      {/* Quick Switch to Phone Login */}
      <View style={styles.altLinksRow}>
        <Pressable
          onPress={() => router.push('/phone-login')}
          style={styles.altLinkPill}
          accessibilityRole="button"
        >
          <AppIcon name="phone" size={14} color={color.primary} />
          <Text style={styles.altLinkText}>Sign In with Phone OTP</Text>
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
  inputGroup: {
    gap: space.x2,
  },
  inputLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    color: color.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forgotLink: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  textInputRow: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: 'rgba(67, 30, 190, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: space.x3,
  },
  field: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: space.x2,
  },
  eyeButton: {
    padding: space.x2,
  },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: color.border,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  rememberText: {
    color: color.ink,
    fontSize: 13,
    fontWeight: '600',
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
  socialButtonsCol: {
    gap: space.x2,
  },
  appleButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    minHeight: 48,
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    minHeight: 48,
  },
  googleButtonText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  altLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  altLinkPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.06)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  altLinkText: {
    color: color.primary,
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
