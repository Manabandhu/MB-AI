import { color as colors, radius, space } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { foundationRoutes } from '@/modules/foundation/foundationConstants';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password';

const authContent: Record<AuthMode, { title: string; subtitle: string; action: string }> = {
  'sign-in': {
    title: 'Sign in',
    subtitle:
      'Continue into ManaBandhu with your email. Supabase auth wiring can plug into this surface.',
    action: 'Sign in',
  },
  'sign-up': {
    title: 'Create your account',
    subtitle: 'Join your local community with a privacy-aware profile and safe discovery defaults.',
    action: 'Create account',
  },
  'forgot-password': {
    title: 'Reset password',
    subtitle:
      'Enter your email and we will send recovery instructions when auth email is configured.',
    action: 'Send reset link',
  },
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const content = authContent[mode];
  const showPassword = mode !== 'forgot-password';

  return (
    <FeatureScreen
      eyebrow="Account"
      subtitle={content.subtitle}
      title={content.title}
      actions={[
        { label: 'Home', route: foundationRoutes.home },
        { label: 'Explore', route: '/explore' },
      ]}
    >
      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          inputMode="email"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />
        {showPassword ? (
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(foundationRoutes.home)}
          style={styles.submit}
        >
          <Text style={styles.submitText}>{content.action}</Text>
        </Pressable>
        <Text style={styles.note}>
          This screen is ready for Supabase auth integration; current demo mode continues to home.
        </Text>
      </View>
    </FeatureScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x3,
    maxWidth: 520,
    padding: space.x4,
  },
  input: {
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: space.x4,
  },
  submit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    justifyContent: 'center',
    minHeight: 52,
  },
  submitText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
