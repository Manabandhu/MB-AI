import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useQuickJump } from '@/modules/foundation/launcher/QuickJump';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
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
      {[
        {
          label: t('tabs.home'),
          icon: 'home',
          href: '/home',
          onPress: () => router.navigate('/home'),
        },
        { label: t('navigation.jump'), icon: 'compass', href: undefined, onPress: open },
        {
          label: t('navigation.saved'),
          icon: 'heart',
          href: '/saved',
          onPress: () => router.navigate('/saved'),
        },
      ].map((item) => (
        <Card
          key={item.icon}
          href={item.href}
          onPress={item.onPress}
          aria-label={item.label}
          flex={1}
          minWidth={0}
          minHeight={64}
          paddingHorizontal="$x1"
          paddingVertical="$x2"
          backgroundColor="transparent"
          borderRadius="$control"
        >
          <YStack alignItems="center" justifyContent="center" gap="$x1">
            <AppIcon name={item.icon as 'home' | 'compass' | 'heart'} size={20} />
            <AppText
              variant="caption"
              fontSize={12}
              lineHeight={18}
              fontWeight="600"
              textAlign="center"
              numberOfLines={2}
              maxWidth="100%"
            >
              {item.label}
            </AppText>
          </YStack>
        </Card>
      ))}
    </XStack>
  );
}
