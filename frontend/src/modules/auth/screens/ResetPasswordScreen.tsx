import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import { AuthButton, AuthField, AuthNotice, AuthScreen } from '@/modules/auth/components/AuthKit';
import {
  friendlyAuthError,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULES,
  parseAuthRedirect,
  passwordProblem,
} from '@/modules/auth/utils/authHelpers';
import { routeAfterAuth } from '@/modules/auth/utils/postAuth';

export function ResetPasswordScreen() {
  const status = useAuthStore((s) => s.status);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const url = Linking.useURL();
  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  // In the app the recovery link arrives as manabandhu://reset-password#access_token=...; the web client reads the
  // fragment itself (detectSessionInUrl).
  useEffect(() => {
    if (!url) return;
    const parsed = parseAuthRedirect(url);
    if (parsed.kind === 'session') {
      // A used or expired link fails here; say so now instead of after the member types a new password.
      supabase.auth
        .setSession({ access_token: parsed.accessToken, refresh_token: parsed.refreshToken })
        .then(({ error }) => {
          if (error) setLinkExpired(true);
        })
        .catch(() => setLinkExpired(true));
    } else if (parsed.kind === 'error') {
      setFormError(friendlyAuthError(new Error(parsed.message)));
    }
  }, [url]);

  const submit = async () => {
    const next = {
      password: passwordProblem(password) ?? undefined,
      confirm: confirm !== password ? "Passwords don't match" : undefined,
    };
    setErrors(next);
    setFormError(null);
    if (next.password || next.confirm) return;
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthScreen
        title="Password updated"
        subtitle="Your new password is ready. Use it the next time you sign in."
        showBack={false}
        footer={<AuthButton label="Continue" onPress={() => void routeAfterAuth()} />}
      >
        <AuthNotice tone="success">You're signed in on this device.</AuthNotice>
      </AuthScreen>
    );
  }

  if (linkExpired || status === 'unauthenticated') {
    return (
      <AuthScreen
        title="Link expired"
        subtitle="This password reset link is no longer valid. Request a new one and open it on this device."
        footer={
          <AuthButton
            label="Request a new link"
            onPress={() => router.replace('/forgot-password')}
          />
        }
      >
        {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Set a new password"
      subtitle="Choose a password you don't use anywhere else."
      footer={<AuthButton label="Update password" loading={submitting} onPress={submit} />}
    >
      {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      <AuthField
        label="New password"
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
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules={PASSWORD_RULES}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthField
        ref={confirmRef}
        label="Confirm new password"
        password
        value={confirm}
        onChangeText={(value) => {
          setConfirm(value);
          if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
        }}
        error={errors.confirm}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
    </AuthScreen>
  );
}
