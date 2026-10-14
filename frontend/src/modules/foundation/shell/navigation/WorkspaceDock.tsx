import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useQuickJump } from '@/modules/foundation/launcher/QuickJump';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useFormFactor } from '@/platform/formFactor';

const TAB_ROUTES = new Set(['/home', '/explore', '/community', '/chat', '/profile']);
const AUTH_ROUTES = new Set([
  '/',
  '/welcome',
  '/sign-in',
  '/sign-up',
  '/phone-login',
  '/email-login',
  '/otp-verification',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/choose-login-method',
]);

/** Keeps every deep screen one tap from Home, the feature launcher and saved items. */
export function WorkspaceDock() {
  const t = useT();
  const { navigationStyle } = useFormFactor();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const open = useQuickJump();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (
    !user ||
    navigationStyle === 'top' ||
    keyboardOpen ||
    TAB_ROUTES.has(pathname) ||
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith('/onboarding')
  )
    return null;
  return (
    <XStack
      role="toolbar"
      aria-label={t('navigation.workspace')}
      backgroundColor="$surface"
      borderTopWidth={1}
      borderColor="$borderColor"
      justifyContent="center"
      gap="$x2"
      paddingHorizontal="$x3"
      paddingTop="$x2"
      paddingBottom={Math.max(insets.bottom, 8)}
    >
      <AppButton
        label={t('tabs.home')}
        icon="home"
        size="sm"
        variant="ghost"
        onPress={() => router.navigate('/home')}
      />
      <AppButton
        label={t('navigation.jump')}
        icon="compass"
        size="sm"
        variant="secondary"
        onPress={open}
      />
      <AppButton
        label={t('navigation.saved')}
        icon="heart"
        size="sm"
        variant="ghost"
        onPress={() => router.navigate('/saved')}
      />
    </XStack>
  );
}
