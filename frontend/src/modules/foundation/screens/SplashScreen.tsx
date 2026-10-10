import { brand } from '@manabandhu/design-system';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { routeAfterAuth } from '@/modules/auth/postAuth';
import { AppText } from '@/modules/shared/ui/AppText';
import { AnimatedBrandMark } from '@/modules/shared/ui/motion/AnimatedBrandMark';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { useAppearance } from '@/theme/ThemeProvider';

/** Launch screen: animated brand mark while the session check settles, then Welcome or the member's next step. */
export function SplashScreen() {
  const rootNavigationState = useRootNavigationState();
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);
  const insets = useSafeAreaInsets();
  const { palette } = useAppearance();

  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  useEffect(() => {
    let redirected = false;
    const doRedirect = () => {
      if (redirected) return;
      redirected = true;
      if (status === 'authenticated') {
        void routeAfterAuth();
      } else {
        router.replace('/welcome');
      }
    };

    // Leave as soon as the session check settles; a short beat lets the logo animation register.
    if (rootNavigationState?.key && !isLoading) {
      const redirectTimer = setTimeout(doRedirect, 500);
      return () => clearTimeout(redirectTimer);
    }

    // Safety fallback: Never trap the user on the splash screen for more than 2.2 seconds
    const fallbackTimer = setTimeout(doRedirect, 2200);
    return () => clearTimeout(fallbackTimer);
  }, [isLoading, rootNavigationState?.key, status]);

  const navigateToWelcome = () => {
    const currentStatus = useAuthStore.getState().status;
    if (currentStatus === 'authenticated') {
      void routeAfterAuth();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <YStack
      alignItems="center"
      aria-label="Continue"
      backgroundColor="$background"
      flex={1}
      gap="$x6"
      justifyContent="center"
      onPress={navigateToWelcome}
      paddingBottom={insets.bottom + 24}
      paddingTop={insets.top + 24}
      role="button"
    >
      <AnimatedBrandMark size={132} />
      <FadeIn delay={250}>
        <YStack alignItems="center" gap="$x2">
          <AppText fontSize={38} fontWeight="800" letterSpacing={-0.5} lineHeight={46}>
            Mana
            <AppText color="$primary" fontSize={38} fontWeight="800" lineHeight={46}>
              Bandhu
            </AppText>
          </AppText>
          <AppText center tone="muted" variant="lead">
            {brand.tagline}
          </AppText>
        </YStack>
      </FadeIn>
      <FadeIn delay={450}>
        <ActivityIndicator color={palette.primary} size="small" />
      </FadeIn>
    </YStack>
  );
}
