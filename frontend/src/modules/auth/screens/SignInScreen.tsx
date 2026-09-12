import { zodResolver } from '@hookform/resolvers/zod';
import { color as baseColors, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

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
  const [loading, setLoading] = useState(false);
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

  const displayError = error || storeError;

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
        {needsConfirmation ? (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Check your email</Text>
            <Text style={styles.confirmationBody}>
              A confirmation link has been sent to your email. Tap the link to verify your account,
              then sign in.
            </Text>
          </View>
        ) : null}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    accessibilityLabel="Email address"
                    value={value}
                    onChangeText={onChange}
                  />
                </Input>
              )}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Enter your password"
                    secureTextEntry
                    accessibilityLabel="Password"
                    value={value}
                    onChangeText={onChange}
                  />
                </Input>
              )}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            ) : null}
          </View>
          {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/forgot-password')}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          <AppButton label="Continue" onPress={handleSubmit(handleSignIn)} loading={loading} />
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
  confirmationBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    gap: space.x2,
    marginBottom: space.x4,
    padding: space.x4,
  },
  confirmationTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  confirmationBody: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
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
