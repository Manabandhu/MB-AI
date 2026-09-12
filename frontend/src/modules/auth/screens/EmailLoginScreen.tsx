import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';

export function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const storeError = useAuthStore((s) => s.error);

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
      badgeText="✉️ Email & Password Authentication"
      backHref="/sign-in"
    >
      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.textInputRow}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            placeholder="you@domain.com"
            placeholderTextColor={color.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setLocalError(null);
            }}
            style={styles.textInput}
            accessibilityLabel="Email Address Input"
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>Password</Text>
          <Pressable onPress={() => router.push('/forgot-password')} accessibilityRole="link">
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </Pressable>
        </View>
        <View style={styles.textInputRow}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={color.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setLocalError(null);
            }}
            style={styles.textInput}
            accessibilityLabel="Password Input"
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
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
          {rememberDevice ? <Text style={styles.checkboxCheck}>✓</Text> : null}
        </View>
        <Text style={styles.rememberText}>Remember this device for 30 days</Text>
      </Pressable>

      {/* Inline Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Primary Sign In Button */}
      <Pressable
        onPress={handleEmailSignIn}
        disabled={loading}
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Authenticating…' : 'Sign In with Email →'}
        </Text>
      </Pressable>

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
          <Text style={styles.appleLogoIcon}></Text>
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
          <Text style={styles.googleIcon}>🌐</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>
      </View>

      {/* Quick Switch to Phone / Magic Link */}
      <View style={styles.altLinksRow}>
        <Pressable
          onPress={() => router.push('/phone-login')}
          style={styles.altLinkPill}
          accessibilityRole="button"
        >
          <Text style={styles.altLinkText}>📱 Phone OTP</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/magic-link')}
          style={styles.altLinkPill}
          accessibilityRole="button"
        >
          <Text style={styles.altLinkText}>🪄 Magic Link</Text>
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
    fontSize: 13,
    fontWeight: '700',
  },
  forgotLink: {
    color: color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  textInputRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: space.x3,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: space.x2,
  },
  textInput: {
    color: color.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  eyeButton: {
    padding: space.x2,
  },
  eyeIcon: {
    fontSize: 16,
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
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
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
  socialButtonsCol: {
    gap: space.x2,
  },
  appleButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  appleLogoIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: space.x2,
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  googleIcon: {
    fontSize: 16,
    marginRight: space.x2,
  },
  googleButtonText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  altLinksRow: {
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
  },
  altLinkPill: {
    backgroundColor: 'rgba(67, 30, 190, 0.06)',
    borderRadius: 999,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  altLinkText: {
    color: color.primary,
    fontSize: 12,
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
