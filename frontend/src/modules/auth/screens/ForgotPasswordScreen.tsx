import { color as baseColors, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
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

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.authTitle}>Forgot Password</Text>
          <Text style={styles.authBody}>Enter your email and we will help you reset access.</Text>
        </View>
        <View style={styles.form}>
          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successBody}>
                If an account exists for {email || 'that email'}, we sent a reset link.
              </Text>
              <AppButton label="Back to Sign In" route="/sign-in" />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </Input>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <AppButton label="Send reset link" onPress={handleReset} loading={loading} />
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/sign-in')}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </Pressable>
            </>
          )}
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
  successBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    gap: space.x3,
    padding: space.x4,
  },
  successTitle: { color: colors.success, fontSize: 18, fontWeight: '800' },
  successBody: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  backLink: { alignSelf: 'center', marginTop: space.x3 },
  backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
});
