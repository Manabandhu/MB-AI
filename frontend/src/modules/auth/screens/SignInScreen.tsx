import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, type TextInput, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthScreen,
  AuthSwitch,
  SocialButtons,
} from '@/modules/auth/components/AuthKit';
import { friendlyAuthError, isValidEmail } from '@/modules/auth/utils/authHelpers';
import { AppText } from '@/modules/shared/ui/AppText';

export function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'apple' | 'google' | null>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter the email you signed up with';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;
    setSubmitting(true);
    try {
      // On success the route guard sends the member to onboarding or Home.
      await signIn(email.trim().toLowerCase(), password);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const social = async (provider: 'apple' | 'google') => {
    setFormError(null);
    setSocialBusy(provider);
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSocialBusy(null);
    }
  };

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to your ManaBandhu account."
      footer={
        <>
          <AuthButton
            label="Sign in"
            loading={submitting}
            disabled={!!socialBusy}
            onPress={submit}
          />
          <AuthSwitch
            prompt="New to ManaBandhu?"
            action="Create account"
            onPress={() => router.replace('/sign-up')}
          />
        </>
      }
    >
      {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      <SocialButtons
        busy={socialBusy}
        onApple={() => social('apple')}
        onGoogle={() => social('google')}
      />
      <AuthDivider label="or sign in with email" />
      <AuthField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        error={errors.email}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <View>
        <AuthField
          ref={passwordRef}
          label="Password"
          password
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          placeholder="Your password"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => router.push('/forgot-password')}
          style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}
        >
          <AppText tone="primary" variant="bodyStrong">
            Forgot password?
          </AppText>
        </Pressable>
      </View>
      <AuthButton
        variant="link"
        label="Sign in with phone number instead"
        onPress={() => router.push('/phone-login')}
      />
    </AuthScreen>
  );
}
