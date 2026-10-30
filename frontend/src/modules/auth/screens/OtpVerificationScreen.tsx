import { space } from '@manabandhu/design-system';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { friendlyAuthError, OTP_CODE_LENGTH, phoneLastFour } from '@/modules/auth/authHelpers';
import { AuthButton, AuthNotice, AuthScreen } from '@/modules/auth/components/AuthKit';
import { useAppearance } from '@/theme/ThemeProvider';

const CODE_LENGTH = OTP_CODE_LENGTH;
const RESEND_SECONDS = 30;

export function OtpVerificationScreen() {
  const identifier = useAuthStore((s) => s.otpIdentifier);
  const otpType = useAuthStore((s) => s.otpType);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signInWithPhone = useAuthStore((s) => s.signInWithPhone);
  const signInWithEmailOtp = useAuthStore((s) => s.signInWithEmailOtp);
  const { palette } = useAppearance();
  const inputRef = useRef<TextInput>(null);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!identifier || !otpType)
    return <Redirect href={otpType === 'email' ? '/sign-in' : '/phone-login'} />;

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits`);
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      // On success the route guard sends the member to onboarding or Home.
      await verifyOtp(identifier, value, otpType);
    } catch (err) {
      setError(friendlyAuthError(err));
      setCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (resending) return;
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      if (otpType === 'sms') await signInWithPhone(identifier);
      else await signInWithEmailOtp(identifier);
      setNotice('We sent a new code.');
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  // Where "Change number" / "Use a different email" goes when there is no screen to go back to.
  const startOver = () => {
    const fallback = otpType === 'sms' ? '/phone-login' : '/sign-in';
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  const destination =
    otpType === 'sms' ? `the number ending in ${phoneLastFour(identifier)}` : identifier;

  return (
    <AuthScreen
      title="Enter the code"
      subtitle={`We sent a ${CODE_LENGTH}-digit code to ${destination}.`}
      footer={
        <>
          <AuthButton label="Verify" loading={verifying} onPress={() => verify()} />
          <AuthButton
            variant="link"
            label={otpType === 'sms' ? 'Change number' : 'Use a different email'}
            disabled={verifying}
            onPress={startOver}
          />
        </>
      }
    >
      {error ? (
        <AuthNotice>{error}</AuthNotice>
      ) : notice ? (
        <AuthNotice tone="success">{notice}</AuthNotice>
      ) : null}
      <Pressable accessible={false} onPress={() => inputRef.current?.focus()} style={styles.boxes}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const active = index === Math.min(code.length, CODE_LENGTH - 1);
          return (
            <View
              key={index}
              style={[
                styles.box,
                { borderColor: palette.border, backgroundColor: palette.surface },
                active && { borderColor: palette.primary, borderWidth: 2 },
                error ? { borderColor: palette.error } : null,
              ]}
            >
              <Text style={[styles.digit, { color: palette.ink }]}>{code[index] ?? ''}</Text>
            </View>
          );
        })}
        {/* One real input behind the boxes so iOS can offer the code from Messages and paste works. */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(value) => {
            const next = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
            setCode(next);
            if (error) setError(null);
            if (next.length === CODE_LENGTH) void verify(next);
          }}
          autoFocus
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={CODE_LENGTH}
          accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
          caretHidden
          style={styles.hiddenInput}
        />
      </Pressable>
      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={[styles.resendWait, { color: palette.muted }]}>
            You can request a new code in {secondsLeft}s
          </Text>
        ) : (
          <AuthButton
            variant="link"
            label={resending ? 'Sending…' : 'Send a new code'}
            loading={resending}
            disabled={verifying}
            onPress={resend}
          />
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: space.x2 },
  box: {
    flex: 1,
    maxWidth: 56,
    aspectRatio: 0.82,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.011,
    color: 'transparent',
  },
  resendRow: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  resendWait: { fontSize: 15 },
});
