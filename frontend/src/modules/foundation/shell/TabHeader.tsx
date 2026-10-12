import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useFormFactor } from '@/platform/formFactor';
import { UnreadNotificationDot } from './UnreadNotificationDot';

type TabHeaderProps = { title: string; subtitle?: string; actions?: ReactNode };

/**
 * Title row for primary tabs (Explore, Community, Chat, Profile): `h1` title, optional muted subtitle, then actions.
 * On phones it also carries the notifications bell (the rail/top bar has it elsewhere). Actions align to the top so
 * the bell sits in the same place on every tab, however many lines the subtitle wraps to.
 */
export function TabHeader({ title, subtitle, actions }: TabHeaderProps) {
  const { navigationStyle } = useFormFactor();
  const t = useT();
  return (
    <XStack alignItems="flex-start" gap="$x3">
      <YStack flex={1} gap="$x1">
        <Heading variant="h1">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>
      {actions ? (
        <XStack alignItems="center" gap="$x2">
          {actions}
        </XStack>
      ) : null}
      {navigationStyle === 'bottom' ? (
        <IconButton
          badge={<UnreadNotificationDot />}
          icon="bell"
          label={t('shell.notifications')}
          onPress={() => router.push('/notifications')}
        />
      ) : null}
    </XStack>
  );
}
