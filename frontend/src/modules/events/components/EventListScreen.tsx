import type { UseQueryResult } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import type { Event } from '@/modules/events/api';
import { EventCard } from '@/modules/events/components/EventCard';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

type EventListScreenProps = {
  title: string;
  subtitle: string;
  query: UseQueryResult<Event[]>;
  /** False while signed out: the list shows a loading state until the auth redirect. */
  ready?: boolean;
  empty: { title: string; body: string; actionLabel: string; route: Href };
  badgeFor?: (event: Event) => string | undefined;
};

/** A personal event list (mine, saved) with local search and pull to refresh. */
export function EventListScreen({
  title,
  subtitle,
  query,
  ready = true,
  empty,
  badgeFor,
}: EventListScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const events = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const sorted = (query.data ?? []).slice().sort((a, b) => {
      const ta = a.startAt ? new Date(a.startAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.startAt ? new Date(b.startAt).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
    if (!needle) return sorted;
    return sorted.filter((e) =>
      [e.title, e.location, e.description].some((f) => (f ?? '').toLowerCase().includes(needle)),
    );
  }, [query.data, search]);

  const body = () => {
    if (!ready || query.isLoading) {
      return <LoadingState count={3} label="Loading events…" variant="skeleton" />;
    }
    if (query.isError) {
      return (
        <ErrorState
          body={errorText(query.error)}
          onRetry={() => query.refetch()}
          retryLabel="Retry"
          title="Could not load events"
        />
      );
    }
    if ((query.data ?? []).length === 0) {
      return (
        <EmptyState
          actionLabel={empty.actionLabel}
          body={empty.body}
          iconName="event"
          onAction={() => router.push(empty.route)}
          title={empty.title}
        />
      );
    }
    if (events.length === 0) {
      return (
        <EmptyState
          actionLabel="Clear search"
          body="Try a different word."
          onAction={() => setSearch('')}
          title="No matches"
        />
      );
    }
    return (
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }} gap={12}>
        {events.map((event) => (
          <EventCard badge={badgeFor?.(event)} event={event} key={event.id} />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: '/events' as Href }} subtitle={subtitle} title={title} />
        <TextField
          accessibilityLabel={`Search ${title.toLowerCase()}`}
          leadingIcon="search"
          onChangeText={setSearch}
          placeholder="Search by name or place"
          value={search}
        />
        {body()}
      </YStack>
    </Screen>
  );
}
