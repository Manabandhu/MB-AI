import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const RESEND_COOLDOWN = 60;

export function ForgotPasswordScreen() {
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

  async function handleSendReset() {
    const trimmed = email.trim();
    if (!trimmed?.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().resetPassword(trimmed);
      setSent(true);
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (countdown > 0) return;
    handleSendReset();
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title={sent ? 'Check Your Email' : 'Forgot Password'}
      subtitle={
        sent
          ? `We’ve dispatched password recovery instructions to ${email}`
          : 'Enter your registered email and we’ll help you reset your password'
      }
      badgeText="Account Access Recovery"
      backHref="/sign-in"
    >
      {sent ? (
        <View style={styles.successCard}>
          <View style={styles.keyIconWrap}>
            <AppIcon name="key" size={28} color={color.primary} />
          </View>
          <Text style={styles.successTitle}>Recovery Email Sent</Text>
          <Text style={styles.successBody}>
            Follow the secure link sent to <Text style={styles.emailHighlight}>{email}</Text> to
            create a new password for your account.
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
                  {loading ? 'Resending…' : 'Resend Reset Link'}
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/sign-in')}
            style={styles.returnButton}
            accessibilityRole="button"
          >
            <Text style={styles.returnButtonText}>Back to Sign In →</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Email Input using Gluestack */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REGISTERED EMAIL ADDRESS</Text>
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
                  accessibilityLabel="Registered Email Address"
                  style={styles.field}
                />
              </Input>
            </View>
            <Text style={styles.helperText}>
              We’ll check our records and email you a password reset link.
            </Text>
          </View>

          {/* Inline Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <AppIcon name="warning" size={16} color="#ba1a1a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Send Reset Link CTA via Gluestack AppButton */}
          <AppButton
            label={loading ? 'Sending Instructions…' : 'Send Reset Link →'}
            onPress={handleSendReset}
            loading={loading}
          />

          {/* Back to Sign In */}
          <Pressable
            onPress={() => router.push('/sign-in')}
            style={styles.backLink}
            accessibilityRole="link"
          >
            <Text style={styles.backLinkText}>Remembered your password? Sign In</Text>
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  backLink: {
    alignSelf: 'center',
    marginTop: space.x2,
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
  keyIconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 60,
    justifyContent: 'center',
    width: 60,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
  returnButton: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: space.x2,
    paddingHorizontal: space.x6,
    paddingVertical: space.x3,
  },
  returnButtonText: {
    color: color.ink,
    fontSize: 14,
    fontWeight: '700',
  },
});
