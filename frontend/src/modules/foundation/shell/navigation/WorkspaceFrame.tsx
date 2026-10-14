import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useFormFactor } from '@/platform/formFactor';
import { SidebarShell } from './SidebarShell';
import { TabBadge } from './TabBadge';
import { primaryTabs } from './tabs';
import { useTabLabels } from './useChatUnread';

const primaryRoutes = new Set(primaryTabs.map((tab) => `/${tab.name}`));
const publicRoutes = new Set([
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

/** Deep screens get the same desktop orientation; primary tabs render their own stateful tab sidebar. */
export function WorkspaceFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const user = useAuthStore((s) => s.user);
  const { navigationStyle } = useFormFactor();
  const labels = useTabLabels();
  const sidebar =
    Boolean(user) &&
    navigationStyle === 'top' &&
    !primaryRoutes.has(path) &&
    !publicRoutes.has(path) &&
    !path.startsWith('/onboarding');
  return (
    <XStack flex={1} backgroundColor="$background">
      {sidebar ? (
        <SidebarShell>
          <YStack gap="$x2" role="navigation" aria-label="Primary navigation">
            {primaryTabs.map((tab) => {
              const { label, count, a11yLabel } = labels(tab.name);
              return (
                <Card
                  key={tab.name}
                  href={`/${tab.name}`}
                  aria-label={a11yLabel}
                  padding="$x3"
                  minHeight={48}
                  backgroundColor="transparent"
                  borderRadius="$control"
                  hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
                >
                  <XStack alignItems="center" gap="$x3">
                    <AppIcon name={tab.icon} size={20} />
                    <AppText flex={1} variant="label">
                      {label}
                    </AppText>
                    <TabBadge count={count} placement="inline" />
                  </XStack>
                </Card>
              );
            })}
          </YStack>
        </SidebarShell>
      ) : null}
      <YStack flex={1} minWidth={0}>
        {children}
      </YStack>
    </XStack>
  );
}
