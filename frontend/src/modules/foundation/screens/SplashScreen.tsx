import { brand } from '@manabandhu/design-system';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { routeAfterAuth } from '@/modules/auth/utils/postAuth';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { AnimatedBrandMark } from '@/modules/shared/ui/motion/AnimatedBrandMark';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { useAppearance } from '@/theme/ThemeProvider';

const SETTLED_DELAY_MS = 500;
const SLOW_CHECK_MS = 8000;

/** Launch screen: animated brand mark while the session check settles, then Welcome or the member's next step. */
export function SplashScreen() {
  const rootNavigationState = useRootNavigationState();
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);
  const insets = useSafeAreaInsets();
  const { palette } = useAppearance();

  // The root layout runs the one session check; this screen only waits for it to settle, then routes once.
  const [slow, setSlow] = useState(false);
  const settled = status !== 'loading' && !isLoading;

  useEffect(() => {
    if (!rootNavigationState?.key || !settled) return;
    // A short beat lets the logo animation register before leaving.
    const timer = setTimeout(() => {
      if (useAuthStore.getState().status === 'authenticated') void routeAfterAuth();
      else router.replace('/welcome');
    }, SETTLED_DELAY_MS);
    return () => clearTimeout(timer);
  }, [rootNavigationState?.key, settled]);

  // Never bounce a signed-in member to Welcome just because the check is slow: keep waiting, and after a while
  // offer a retry instead.
  useEffect(() => {
    if (settled) return;
    const timer = setTimeout(() => setSlow(true), SLOW_CHECK_MS);
    return () => clearTimeout(timer);
  }, [settled]);

  const retry = () => {
    setSlow(false);
    useAuthStore
      .getState()
      .checkSession()
      .catch(() => setSlow(true));
  };

  return (
    <YStack
      alignItems="center"
      backgroundColor="$background"
      flex={1}
      gap="$x6"
      justifyContent="center"
      paddingBottom={insets.bottom + 24}
      paddingTop={insets.top + 24}
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
        {slow ? (
          <YStack alignItems="center" gap="$x3">
            <AppText center role="alert" tone="muted" variant="caption">
              Still connecting. Check your internet connection.
            </AppText>
            <AppButton label="Try again" onPress={retry} size="sm" variant="secondary" />
          </YStack>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading" color={palette.primary} size="small" />
        )}
      </FadeIn>
    </YStack>
  );
}
