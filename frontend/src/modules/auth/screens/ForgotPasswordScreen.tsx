import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { AuthButton, AuthField, AuthNotice, AuthScreen } from '@/modules/auth/components/AuthKit';
import { friendlyAuthError, isValidEmail } from '@/modules/auth/utils/authHelpers';

export function ForgotPasswordScreen() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setFieldError('Enter the email you signed up with');
      return;
    }
    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const normalized = email.trim().toLowerCase();
      await resetPassword(normalized);
      setSentTo(normalized);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthScreen
        title="Check your email"
        subtitle={`If an account exists for ${sentTo}, you'll get a link to set a new password.`}
        footer={
          <>
            <AuthButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            <AuthButton variant="link" label="Resend link" onPress={() => setSentTo(null)} />
          </>
        }
      >
        <AuthNotice tone="info">
          Open the link on this device. Check spam if it doesn't arrive in a few minutes.
        </AuthNotice>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a link to set a new password."
      footer={<AuthButton label="Send reset link" loading={submitting} onPress={submit} />}
    >
      {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      <AuthField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (fieldError) setFieldError(null);
        }}
        error={fieldError}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        autoFocus
        onSubmitEditing={submit}
      />
    </AuthScreen>
  );
}
