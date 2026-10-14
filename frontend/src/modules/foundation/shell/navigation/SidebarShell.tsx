import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useQuickJump } from '@/modules/foundation/launcher/QuickJump';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BrandLogo } from '@/modules/shared/ui/BrandLogo';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useAppearance } from '@/theme/ThemeProvider';
import { UnreadNotificationDot } from '../UnreadNotificationDot';

/** Shared desktop navigation frame on both primary tabs and deep module routes. */
export function SidebarShell({ children }: { children: ReactNode }) {
  const t = useT();
  const { palette } = useAppearance();
  const open = useQuickJump();
  const insets = useSafeAreaInsets();
  return (
    <YStack
      width={224}
      backgroundColor="$background"
      padding="$x4"
      gap="$x6"
      borderRightWidth={1}
      borderColor="$borderColor"
      paddingTop={insets.top + 28}
    >
      <YStack paddingHorizontal="$x2">
        <BrandLogo size={30} variant="wordmark" />
      </YStack>
      <Card
        onPress={open}
        aria-label={t('navigation.openJump')}
        padding="$x3"
        borderRadius="$control"
      >
        <XStack gap="$x2" alignItems="center">
          <AppIcon name="search" size={18} color={palette.muted} />
          <AppText variant="caption" flex={1}>
            {t('navigation.jump')}
          </AppText>
          <AppText variant="caption" tone="muted">
            ⌘ K
          </AppText>
        </XStack>
      </Card>
      {children}
      <YStack flex={1} />
      <YStack gap="$x2" borderTopWidth={1} borderColor="$borderColor" paddingTop="$x4">
        <Card href="/saved" padding="$x3" borderWidth={0} backgroundColor="transparent">
          <XStack gap="$x3" alignItems="center">
            <AppIcon name="heart" size={18} />
            <AppText variant="label">{t('navigation.saved')}</AppText>
          </XStack>
        </Card>
        <Card href="/settings" padding="$x3" borderWidth={0} backgroundColor="transparent">
          <XStack gap="$x3" alignItems="center">
            <AppIcon name="settings" size={18} />
            <AppText variant="label">{t('navigation.settings')}</AppText>
          </XStack>
        </Card>
        <XStack gap="$x2" alignItems="center">
          <IconButton
            icon="bell"
            label={t('shell.notifications')}
            badge={<UnreadNotificationDot />}
            onPress={() => router.push('/notifications')}
            variant="plain"
          />
          <AppText variant="caption" tone="muted">
            {t('shell.notifications')}
          </AppText>
        </XStack>
      </YStack>
    </YStack>
  );
}
