import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useFormFactor } from '@/platform/formFactor';
import { UnreadNotificationDot } from './UnreadNotificationDot';

type TabHeaderProps = { title: string; subtitle?: string; actions?: ReactNode };

/** Title row for primary tabs. On phones it also carries the notifications bell (the rail/top bar has it elsewhere). */
export function TabHeader({ title, subtitle, actions }: TabHeaderProps) {
  const { navigationStyle } = useFormFactor();
  return (
    <XStack alignItems="center" gap="$x3">
      <YStack flex={1} gap="$x1">
        <Heading variant="h1">{title}</Heading>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </YStack>
      {actions}
      {navigationStyle === 'bottom' ? (
        <IconButton
          badge={<UnreadNotificationDot />}
          icon="bell"
          label="Open notifications"
          onPress={() => router.push('/notifications')}
        />
      ) : null}
    </XStack>
  );
}
