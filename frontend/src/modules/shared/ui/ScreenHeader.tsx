import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string | null;
  /** Shows a back button that falls back to `fallback` when there is no history. Omit or `false` for none. */
  back?: { fallback: Href } | false;
  /** Trailing icon buttons (share, save, filter). */
  actions?: ReactNode;
  /** One primary button (e.g. "Post a room"). Give `onPress` or `route`. */
  primaryAction?: { label: string; icon?: AppIconName; onPress?: () => void; route?: Href };
};

/**
 * Page header: back button, an `h2` heading with optional caption, trailing actions, and an optional primary
 * button. Actions wrap onto their own line when the window is too narrow.
 */
export function ScreenHeader({ title, subtitle, back, actions, primaryAction }: ScreenHeaderProps) {
  const onPrimary = primaryAction
    ? (primaryAction.onPress ??
      (primaryAction.route ? () => router.push(primaryAction.route as Href) : undefined))
    : undefined;
  return (
    <XStack
      alignItems="center"
      columnGap="$x3"
      flexWrap="wrap"
      rowGap="$x3"
      paddingVertical="$x2"
      width="100%"
    >
      <XStack
        alignItems="center"
        flexBasis={240}
        flexGrow={1}
        flexShrink={1}
        gap="$x2"
        minWidth={0}
      >
        {back ? <BackButton fallback={back.fallback} /> : null}
        <YStack flex={1} gap={2} minWidth={0}>
          <Heading variant="h1">{title}</Heading>
          {subtitle ? (
            <AppText tone="muted" variant="body">
              {subtitle}
            </AppText>
          ) : null}
        </YStack>
      </XStack>
      {actions || primaryAction ? (
        // maxWidth keeps the row inside the header so its own wrap applies on phones instead of overflowing.
        <XStack alignItems="center" flexWrap="wrap" gap="$x2" marginLeft="auto" maxWidth="100%">
          {actions}
          {primaryAction ? (
            <AppButton
              size="sm"
              icon={primaryAction.icon}
              label={primaryAction.label}
              onPress={onPrimary}
            />
          ) : null}
        </XStack>
      ) : null}
    </XStack>
  );
}
