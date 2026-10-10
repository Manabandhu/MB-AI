import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { useTheme, XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText, Heading } from '@/modules/shared/ui/AppText';

type SectionProps = {
  title: string;
  subtitle?: string;
  /** "See all" style link in the header. */
  action?: { label: string; href: string };
  children: ReactNode;
};

/** Titled block used to group content on every screen, with an optional "See all" link. */
export function Section({ title, subtitle, action, children }: SectionProps) {
  const theme = useTheme();
  return (
    <YStack gap="$x3" width="100%">
      <XStack alignItems="flex-end" gap="$x3" justifyContent="space-between">
        <YStack flex={1} gap="$x1">
          <Heading variant="h4">{title}</Heading>
          {subtitle ? (
            <AppText tone="muted" variant="caption">
              {subtitle}
            </AppText>
          ) : null}
        </YStack>
        {action ? (
          <Link aria-label={`${action.label}: ${title}`} href={action.href as Href}>
            <XStack alignItems="center" gap="$x1" minHeight="$touch">
              <AppText tone="primary" variant="label">
                {action.label}
              </AppText>
              <AppIcon color={theme.primary?.val} name="chevron-right" size={16} />
            </XStack>
          </Link>
        ) : null}
      </XStack>
      {children}
    </YStack>
  );
}
