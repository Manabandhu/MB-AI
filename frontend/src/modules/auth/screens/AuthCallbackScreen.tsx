import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';
import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import { AuthButton, AuthNotice, AuthScreen } from '@/modules/auth/components/AuthKit';
import { friendlyAuthError, parseAuthRedirect } from '@/modules/auth/utils/authHelpers';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

/**
 * Landing page for web OAuth and email-confirmation links. Tokens in the fragment are picked up by the Supabase
 * client; a PKCE `code` is exchanged here. Once a session exists the route guard continues to onboarding or Home.
 */
export function AuthCallbackScreen() {
  useRedirectIfAuthenticated();
  const { palette } = useAppearance();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const parsed = parseAuthRedirect(url);
    if (parsed.kind === 'error') {
      setError(friendlyAuthError(new Error(parsed.message)));
    } else if (parsed.kind === 'code') {
      void supabase.auth.exchangeCodeForSession(parsed.code).then(({ error: exchangeError }) => {
        if (exchangeError) setError(friendlyAuthError(exchangeError));
      });
    } else if (parsed.kind === 'session') {
      void supabase.auth
        .setSession({ access_token: parsed.accessToken, refresh_token: parsed.refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) setError(friendlyAuthError(sessionError));
        });
    } else {
      // The client may already have consumed the fragment during start-up; only fail if no session resulted.
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setError('This sign-in link is incomplete or has already been used.');
      });
    }
  }, []);

  if (error) {
    return (
      <AuthScreen
        title="We couldn't sign you in"
        showBack={false}
        footer={<AuthButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />}
      >
        <AuthNotice>{error}</AuthNotice>
      </AuthScreen>
    );
  }

  return (
    <YStack
      accessibilityLiveRegion="polite"
      alignItems="center"
      backgroundColor="$surface"
      flex={1}
      gap="$x4"
      justifyContent="center"
    >
      <ActivityIndicator size="large" color={palette.primary} />
      <AppText tone="muted" variant="lead">
        Signing you in…
      </AppText>
    </YStack>
  );
}
