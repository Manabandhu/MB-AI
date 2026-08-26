import { color as baseColors, space } from '@manabandhu/design-system';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';
import { supabase } from '@/lib/supabase';

const colors = {
  ...baseColors,
  appPrimary: '#2c0096',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  appShellSurface: '#efedf4',
  warm: '#ff7e33',
};

const OTP_COUNTDOWN_SECONDS = 60;

export function OtpVerificationScreen() {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      setResendAvailable(true);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: 'demo@manabandhu.local', token: code, type: 'email' });
      if (error) throw error;
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    setResendAvailable(false);
    setCountdown(OTP_COUNTDOWN_SECONDS);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.authHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.headerTitle}>ManaBandhu</Text>
          </View>
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallbackText className="text-primary-foreground">MB</AvatarFallbackText>
          </Avatar>
        </View>
        <View style={styles.authHero}>
          <Text style={styles.authTitle}>OTP Verification</Text>
          <Text style={styles.authBody}>Enter the verification code we sent you.</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Verification code</Text>
            <Input className="min-h-14 rounded-xl bg-secondary/70">
              <InputField
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </Input>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton label="Verify" onPress={handleVerify} loading={loading} />
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn’t get the code? </Text>
            {resendAvailable ? (
              <Pressable onPress={handleResend} accessibilityRole="button">
                <Text style={styles.resendAction}>Resend</Text>
              </Pressable>
            ) : (
              <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.x4 },
  authHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,255,0.92)',
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    marginBottom: space.x6,
    paddingHorizontal: space.x4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  headerTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  authHero: { alignItems: 'center', gap: space.x2, marginBottom: space.x6, marginTop: space.x16 },
  authTitle: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    textAlign: 'center',
  },
  authBody: { color: colors.muted, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  resendRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  resendLabel: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  resendAction: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  resendCountdown: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
});
