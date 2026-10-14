import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import {
  type AppIconName,
  IconButton,
  Screen,
  ScreenHeader,
  SkeletonCard,
  StatusBadge,
  type StatusTone,
  TextField,
} from '@/modules/shared/ui';
import { statusLabel } from '../adminAccess';

type AdminModerationListProps<T extends { id: string }> = {
  title: string;
  subtitle: string;
  /** Plural noun used in the error/empty copy ("rooms", "community posts"). */
  noun: string;
  searchPlaceholder: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<T[]>;
  /** Case-insensitive search: the lower-cased query is matched against these strings. */
  searchText: (item: T) => string[];
  renderItem: (item: T) => ReactNode;
  emptyIcon?: AppIconName;
};

/** Moderation-status tone: live content reads as success, taken-down content as danger. */
export function moderationTone(status: string | null | undefined): StatusTone {
  const value = (status ?? '').trim().toLowerCase();
  if (['active', 'open', 'published', 'approved', 'live'].includes(value)) return 'success';
  if (['removed', 'hidden', 'rejected', 'banned', 'deleted', 'suspended'].includes(value))
    return 'danger';
  if (['pending', 'draft', 'in_review', 'flagged'].includes(value)) return 'warning';
  return 'neutral';
}

/** Status badge plus a "Reported" badge for moderation rows. */
export function ModerationBadges({ status, reported }: { status: string; reported?: boolean }) {
  return (
    <XStack flexWrap="wrap" gap="$x2" marginTop="$x1">
      <StatusBadge label={statusLabel(status)} tone={moderationTone(status)} />
      {reported ? <StatusBadge icon="warning" label="Reported" tone="danger" /> : null}
    </XStack>
  );
}

/** Shared admin list chrome: header with back to the console, search, loading/error/empty states, rows. */
export function AdminModerationList<T extends { id: string }>({
  title,
  subtitle,
  noun,
  searchPlaceholder,
  queryKey,
  queryFn,
  searchText,
  renderItem,
  emptyIcon = 'search',
}: AdminModerationListProps<T>) {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey, queryFn });

  const filtered = useMemo(() => {
    const items = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => searchText(item).some((s) => s.toLowerCase().includes(q)));
  }, [data, query, searchText]);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <ScreenHeader back={{ fallback: '/admin' as Href }} subtitle={subtitle} title={title} />
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        leadingIcon="search"
        onChangeText={setQuery}
        placeholder={searchPlaceholder}
        trailing={
          query ? (
            <IconButton
              icon="close"
              label="Clear search"
              onPress={() => setQuery('')}
              variant="plain"
            />
          ) : undefined
        }
        value={query}
      />
      {isError ? (
        <ErrorState
          body="Please check your connection and try again."
          onRetry={() => void refetch()}
          retryLabel="Retry"
          title={`Unable to load ${noun}`}
        />
      ) : isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </YStack>
      ) : filtered.length === 0 ? (
        <EmptyState
          actionLabel="Clear search"
          body="Try adjusting your search."
          iconName={emptyIcon}
          onAction={() => setQuery('')}
          title={`No ${noun} found`}
        />
      ) : (
        <YStack gap="$x2">{filtered.map((item) => renderItem(item))}</YStack>
      )}
    </Screen>
  );
}
