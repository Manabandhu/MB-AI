import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { Card } from '@/modules/shared/ui/Card';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';

type PersonRowProps = {
  name: string;
  imageUrl?: string | null;
  /** Role, rating, seats, or another short fact about the person. */
  subtitle?: string | null;
  /** Inline element after the name, usually a `StatusBadge`. */
  badge?: ReactNode;
  /** Trailing controls (message, accept, decline). */
  actions?: ReactNode;
  /** Opens the person's profile or request when the row is pressed. */
  href?: Href;
  /** Longer text under the row at full width (a request note), so it is not clipped beside the actions. */
  detail?: ReactNode;
};

/**
 * One person in a list (riders, inquirers, members): avatar, name with optional badge, subtitle, and actions.
 * Only the avatar and text are pressable, so action presses never also follow `href`.
 */
export function PersonRow({
  name,
  imageUrl,
  subtitle,
  badge,
  actions,
  href,
  detail,
}: PersonRowProps) {
  return (
    <Card padding="$x3">
      <XStack alignItems="center" gap="$x3">
        <XStack
          alignItems="center"
          aria-label={[name, subtitle].filter(Boolean).join(', ')}
          borderRadius="$control"
          cursor={href ? 'pointer' : undefined}
          flex={1}
          focusVisibleStyle={
            href
              ? { outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }
              : undefined
          }
          focusable={Boolean(href)}
          gap="$x3"
          minHeight="$touch"
          minWidth={0}
          onPress={href ? () => router.push(href) : undefined}
          {...keyboardPress(href ? () => router.push(href) : undefined)}
          pressStyle={href ? { opacity: 0.8 } : undefined}
          role={href ? 'link' : undefined}
        >
          <Avatar imageUrl={imageUrl} name={name} />
          <YStack flex={1} gap={2} minWidth={0}>
            <XStack alignItems="center" flexWrap="wrap" gap="$x2">
              <AppText flexShrink={1} numberOfLines={1} variant="bodyStrong">
                {name}
              </AppText>
              {badge}
            </XStack>
            {subtitle ? (
              <AppText numberOfLines={2} tone="muted" variant="caption">
                {subtitle}
              </AppText>
            ) : null}
          </YStack>
        </XStack>
        {actions ? (
          <XStack alignItems="center" flexShrink={0} gap="$x2">
            {actions}
          </XStack>
        ) : null}
      </XStack>
      {detail}
    </Card>
  );
}
