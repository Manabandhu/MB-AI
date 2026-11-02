import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { searchEvents } from '@/modules/events/api';
import { EventCard } from '@/modules/events/components/EventCard';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const DEBOUNCE_MS = 350;

/** Server-side event search (`GET /api/v1/events/search?q=`), debounced while typing. */
export default function EventsSearchScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setTerm(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [text]);

  const searchQuery = useQuery({
    queryKey: ['events', 'search', term],
    queryFn: () => searchEvents(term),
    enabled: term.length > 0,
  });
  const results = searchQuery.data ?? [];

  const body = () => {
    if (!term) {
      return (
        <EmptyState
          actionLabel="Browse all events"
          body="Search by event name, place, or description."
          iconName="search"
          onAction={() => router.push('/events' as Href)}
          title="Find an event"
        />
      );
    }
    if (searchQuery.isLoading)
      return <LoadingState count={3} label="Searching…" variant="skeleton" />;
    if (searchQuery.isError) {
      return (
        <ErrorState
          body={errorText(searchQuery.error)}
          onRetry={() => searchQuery.refetch()}
          retryLabel="Retry"
          title="Search failed"
        />
      );
    }
    if (results.length === 0) {
      return (
        <EmptyState
          actionLabel="Clear search"
          body="Try a different word."
          onAction={() => setText('')}
          title="No events found"
        />
      );
    }
    return (
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }} gap={12}>
        {results.map((event) => (
          <EventCard event={event} key={event.id} />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen
      onRefresh={term ? () => searchQuery.refetch() : undefined}
      refreshing={searchQuery.isRefetching}
    >
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: '/events' as Href }} title="Search events" />
        <TextField
          accessibilityLabel="Search events"
          autoFocus
          leadingIcon="search"
          onChangeText={setText}
          placeholder="Diwali, cricket, Austin…"
          returnKeyType="search"
          value={text}
        />
        {body()}
      </YStack>
    </Screen>
  );
}
