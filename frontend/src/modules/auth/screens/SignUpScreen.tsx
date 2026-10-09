import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, type TextInput } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import {
  friendlyAuthError,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  passwordProblem,
} from '@/modules/auth/authHelpers';
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthScreen,
  AuthSwitch,
  authStyles,
  SocialButtons,
} from '@/modules/auth/components/AuthKit';

type FieldErrors = { name?: string; email?: string; password?: string };

export function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'apple' | 'google' | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const validate = (): FieldErrors => ({
    name: name.trim().length < 2 ? 'Enter your name' : undefined,
    email: isValidEmail(email) ? undefined : 'Enter a valid email address',
    password: passwordProblem(password) ?? undefined,
  });

  const submit = async () => {
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (next.name || next.email || next.password) return;
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const needsConfirmation = await signUp(normalizedEmail, password, name.trim());
      // With a session the route guard continues to onboarding; otherwise the member confirms by email first.
      if (needsConfirmation) setConfirmationSentTo(normalizedEmail);
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

  if (confirmationSentTo) {
    return (
      <AuthScreen
        title="Check your email"
        subtitle={`We sent a confirmation link to ${confirmationSentTo}. Open it to finish creating your account, then sign in.`}
        footer={
          <>
            <AuthButton label="Go to sign in" onPress={() => router.replace('/sign-in')} />
            <AuthButton
              variant="link"
              label="Use a different email"
              onPress={() => setConfirmationSentTo(null)}
            />
          </>
        }
      >
        <AuthNotice tone="info">Can't find it? Check your spam or promotions folder.</AuthNotice>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Find rooms, rides, jobs, and friends in your community."
      footer={
        <>
          <AuthButton
            label="Create account"
            loading={submitting}
            disabled={!!socialBusy}
            onPress={submit}
          />
          <AuthSwitch
            prompt="Already have an account?"
            action="Sign in"
            onPress={() => router.replace('/sign-in')}
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
      <AuthDivider label="or sign up with email" />
      <AuthField
        label="Full name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        placeholder="First and last name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthField
        ref={emailRef}
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
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthField
        ref={passwordRef}
        label="Password"
        password
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        onBlur={() =>
          password && setErrors((e) => ({ ...e, password: passwordProblem(password) ?? undefined }))
        }
        error={errors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters with a letter and a number`}
        placeholder="Create a password"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8; required: lower, upper; required: digit;"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Text style={authStyles.legal}>
        By creating an account you agree to use ManaBandhu respectfully and follow its community
        guidelines.
      </Text>
    </AuthScreen>
  );
}
