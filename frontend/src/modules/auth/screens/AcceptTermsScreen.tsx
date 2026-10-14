import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { friendlyAuthError } from '@/modules/auth/authHelpers';
import { AuthButton, AuthNotice, AuthScreen } from '@/modules/auth/components/AuthKit';
import { ConsentCheckbox } from '@/modules/auth/components/ConsentCheckbox';
import { recordTermsConsent } from '@/modules/auth/consent';
import { routeAfterAuth } from '@/modules/auth/postAuth';
import { signOutWithFeedback } from '@/modules/foundation/account/signOut';

/**
 * Shown once after sign-in when the account has no recorded Terms acceptance (Apple/Google or phone sign-in that
 * created the account outside Sign Up, or an account from before consent was recorded). Continuing records the
 * version in the account metadata; the member can sign out instead.
 */
export function AcceptTermsScreen() {
  const status = useAuthStore((s) => s.status);
  const [accepted, setAccepted] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Same target as `authStore.signOut` (which navigates to /welcome), so "Sign out instead" never races two routes.
  if (status === 'unauthenticated') return <Redirect href="/welcome" />;

  const submit = async () => {
    setFormError(null);
    if (!accepted) {
      setConsentError('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setSaving(true);
    try {
      await recordTermsConsent();
      await routeAfterAuth();
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthScreen
      title="Before you continue"
      subtitle="Please review and accept ManaBandhu's Terms of Service and Privacy Policy."
      showBack={false}
      footer={
        <>
          <AuthButton
            label="Accept and continue"
            loading={saving}
            disabled={signingOut}
            onPress={submit}
          />
          <AuthButton
            variant="link"
            label="Sign out instead"
            loading={signingOut}
            disabled={saving}
            onPress={async () => {
              setSigningOut(true);
              await signOutWithFeedback();
              setSigningOut(false);
            }}
          />
        </>
      }
    >
      {formError ? <AuthNotice>{formError}</AuthNotice> : null}
      <ConsentCheckbox
        checked={accepted}
        error={consentError}
        onChange={(next) => {
          setAccepted(next);
          if (next) setConsentError(null);
        }}
      />
    </AuthScreen>
  );
}
