import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { SkeletonCard } from '@/modules/shared/ui/Skeleton';
import { useAppearance } from '@/theme/ThemeProvider';

type WidgetFrameProps = {
  title: string;
  subtitle?: string;
  icon: AppIconName;
  seeAll: { label?: string; href: string };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  empty: { title: string; body: string; actionLabel?: string; actionHref?: string };
  children: ReactNode;
};

/**
 * Frame shared by every module's Home widget: header with "See all", skeleton while loading, inline error with
 * retry, and an honest empty state. Each widget fails on its own; the rest of Home keeps working.
 */
export function WidgetFrame({
  title,
  subtitle,
  icon,
  seeAll,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  empty,
  children,
}: WidgetFrameProps) {
  const { palette } = useAppearance();
  return (
    <Card gap="$x3" padding="$x4" variant="elevated">
      <XStack alignItems="center" gap="$x2">
        <AppIcon color={palette.primary} name={icon} size={18} />
        <YStack flex={1}>
          <Heading variant="h4">{title}</Heading>
          {subtitle ? (
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {subtitle}
            </AppText>
          ) : null}
        </YStack>
        <XStack
          aria-label={`${seeAll.label ?? 'See all'} ${title}`}
          role="link"
          alignItems="center"
          cursor="pointer"
          minHeight="$touch"
          onPress={() => router.push(seeAll.href as never)}
          paddingLeft="$x2"
        >
          <AppText tone="primary" variant="label">
            {seeAll.label ?? 'See all'}
          </AppText>
          <AppIcon color={palette.primary} name="chevron-right" size={16} />
        </XStack>
      </XStack>
      {isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </YStack>
      ) : isError ? (
        <ErrorState
          body="This section could not load. Other sections are unaffected."
          compact
          onRetry={onRetry}
          title={`${title} unavailable`}
        />
      ) : isEmpty ? (
        <EmptyState
          actionLabel={empty.actionLabel}
          body={empty.body}
          compact
          iconName={icon}
          onAction={empty.actionHref ? () => router.push(empty.actionHref as never) : undefined}
          title={empty.title}
        />
      ) : (
        <YStack gap="$x2">{children}</YStack>
      )}
    </Card>
  );
}
