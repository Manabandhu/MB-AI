import { color as baseColors, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@/lib/api';

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

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@manabandhu.local',
        password: 'DemoPass123',
      });
      if (error) throw error;
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo sign in failed';
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
          <Text style={styles.authTitle}>Sign In</Text>
          <Text style={styles.authBody}>Welcome back to your community.</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <Input className="min-h-14 rounded-xl bg-secondary/70">
              <InputField
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Input>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Test user</Text>
            <Text style={styles.demoLine}>Email: demo@manabandhu.local</Text>
            <Text style={styles.demoLine}>Password: DemoPass123</Text>
            <AppButton label="Use demo account" onPress={handleDemoSignIn} variant="secondary" loading={loading} />
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/forgot-password')}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          <AppButton label="Continue" onPress={handleSignIn} loading={loading} />
          <Text style={styles.orText}>or</Text>
          <AppButton label="Create account" route="/sign-up" variant="secondary" />
        </View>
        <View style={styles.privacyChip}>
          <Text style={styles.privacyText}>Your data is safe and private.</Text>
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
  demoCredentials: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    gap: space.x2,
    padding: space.x4,
  },
  demoTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  demoLine: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  orText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  privacyChip: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space.x2,
    marginTop: space.x6,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  privacyText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
});
