import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';

const RESEND_COOLDOWN = 60;

export function MagicLinkScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const storeError = useAuthStore((s) => s.error);

  useEffect(() => {
    if (!sent) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [sent, countdown]);

  async function handleSendMagicLink() {
    const trimmed = email.trim();
    if (!trimmed?.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().signInWithEmailOtp(trimmed);
      setSent(true);
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send magic link';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (countdown > 0) return;
    handleSendMagicLink();
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title={sent ? 'Check Your Inbox' : 'Instant Magic Link'}
      subtitle={
        sent
          ? `We sent a secure, one-click sign-in link to ${email}`
          : 'Sign in effortlessly without remembering any passwords'
      }
      badgeText="🪄 Passwordless Sign In"
      backHref="/sign-in"
    >
      {sent ? (
        <View style={styles.successCard}>
          <View style={styles.mailboxIconWrap}>
            <Text style={styles.mailboxIcon}>📬</Text>
          </View>
          <Text style={styles.successTitle}>Magic Link Dispatched!</Text>
          <Text style={styles.successBody}>
            Open the link from <Text style={styles.emailHighlight}>{email}</Text> on this device to
            instantly access your ManaBandhu account.
          </Text>

          <View style={styles.resendBlock}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>Resend available in {countdown}s</Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={loading}
                style={styles.resendButton}
                accessibilityRole="button"
              >
                <Text style={styles.resendButtonText}>
                  {loading ? 'Resending…' : 'Resend Magic Link'}
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setSent(false)}
            style={styles.changeEmailButton}
            accessibilityRole="button"
          >
            <Text style={styles.changeEmailText}>Try a different email address</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Email Address</Text>
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
            <Text style={styles.helperText}>
              We’ll send an authentication link directly to your inbox. No passwords required.
            </Text>
          </View>

          {/* Inline Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Send Magic Link Button */}
          <Pressable
            onPress={handleSendMagicLink}
            disabled={loading}
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending Magic Link…' : 'Send Magic Link 🪄'}
            </Text>
          </Pressable>

          {/* Other Auth Links */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.altLinksRow}>
            <Pressable
              onPress={() => router.push('/email-login')}
              style={styles.altLinkPill}
              accessibilityRole="button"
            >
              <Text style={styles.altLinkText}>✉️ Password Login</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/phone-login')}
              style={styles.altLinkPill}
              accessibilityRole="button"
            >
              <Text style={styles.altLinkText}>📱 Phone OTP</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/sign-in')}
            style={styles.backLink}
            accessibilityRole="link"
          >
            <Text style={styles.backLinkText}>Return to main Sign In options</Text>
          </Pressable>
        </>
      )}
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: space.x2,
  },
  inputLabel: {
    color: color.ink,
    fontSize: 13,
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
  // Success Card
  successCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(67, 30, 190, 0.04)',
    borderColor: 'rgba(67, 30, 190, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x5,
  },
  mailboxIconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    width: 64,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  mailboxIcon: {
    fontSize: 32,
  },
  successTitle: {
    color: color.ink,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  successBody: {
    color: color.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emailHighlight: {
    color: color.primary,
    fontWeight: '700',
  },
  resendBlock: {
    marginTop: space.x1,
  },
  countdownText: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  resendButton: {
    backgroundColor: color.primary,
    borderRadius: 999,
    paddingHorizontal: space.x5,
    paddingVertical: space.x2,
  },
  resendButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  changeEmailButton: {
    paddingVertical: space.x1,
  },
  changeEmailText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
