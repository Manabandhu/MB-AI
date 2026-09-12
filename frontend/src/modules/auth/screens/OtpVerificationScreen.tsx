import { color, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout';

const OTP_COUNTDOWN = 60;

export function OtpVerificationScreen() {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const otpIdentifier = useAuthStore((s) => s.otpIdentifier);
  const otpType = useAuthStore((s) => s.otpType);
  const storeError = useAuthStore((s) => s.error);

  useEffect(() => {
    if (countdown <= 0) {
      setResendAvailable(true);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleVerify() {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setLocalError('Please enter all 6 digits of the code.');
      return;
    }
    if (!otpIdentifier || !otpType) {
      setLocalError('Verification session expired. Please request a new code.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await useAuthStore.getState().verifyOtp(otpIdentifier, trimmed, otpType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired code';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (!otpIdentifier || !otpType || !resendAvailable) return;
    setResendAvailable(false);
    setCountdown(OTP_COUNTDOWN);
    setLocalError(null);
    useAuthStore
      .getState()
      [otpType === 'email' ? 'signInWithEmailOtp' : 'signInWithPhone'](otpIdentifier)
      .catch((err) => {
        setLocalError(err instanceof Error ? err.message : 'Failed to resend code');
      });
  }

  const error = localError || storeError;

  return (
    <AuthPageLayout
      title="Verify 6-Digit Code"
      subtitle={`Enter the one-time code sent to ${otpIdentifier || 'your contact'}`}
      badgeText="🛡️ Multi-Factor Verification"
      backHref="/sign-in"
    >
      {/* Code Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Verification Code</Text>
        <TextInput
          placeholder="• • • • • •"
          placeholderTextColor={color.muted}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(v) => {
            setCode(v.replace(/\D/g, ''));
            if (error) setLocalError(null);
          }}
          style={styles.otpInput}
          accessibilityLabel="6-Digit OTP Input"
        />
        <Text style={styles.helperText}>
          Didn’t receive it? Check spam folder or ensure carrier isn’t blocking shortcodes.
        </Text>
      </View>

      {/* Inline Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Verify Button */}
      <Pressable
        onPress={handleVerify}
        disabled={loading}
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Verifying Code…' : 'Verify & Continue →'}
        </Text>
      </Pressable>

      {/* Resend Row */}
      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn’t receive the code? </Text>
        {resendAvailable ? (
          <Pressable onPress={handleResend} accessibilityRole="button">
            <Text style={styles.resendActiveText}>Resend Code</Text>
          </Pressable>
        ) : (
          <Text style={styles.resendCountdownText}>Resend in {countdown}s</Text>
        )}
      </View>

      {/* Return / Change Identifier */}
      <Pressable
        onPress={() => {
          useAuthStore.getState().clearOtpContext();
          router.push('/sign-in');
        }}
        style={styles.backLink}
        accessibilityRole="link"
      >
        <Text style={styles.backLinkText}>Use a different sign-in method</Text>
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
    fontSize: 13,
    fontWeight: '700',
  },
  otpInput: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(67, 30, 190, 0.25)',
    borderRadius: 14,
    borderWidth: 2,
    color: color.ink,
    fontSize: 26,
    fontWeight: '900',
    height: 60,
    letterSpacing: 10,
    textAlign: 'center',
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
  resendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x1,
  },
  resendPrompt: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  resendActiveText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  resendCountdownText: {
    color: color.muted,
    fontSize: 13,
    fontWeight: '600',
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
