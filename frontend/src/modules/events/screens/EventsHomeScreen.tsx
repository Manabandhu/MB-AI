import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { listEventCategories, listEvents } from '@/modules/events/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { DiscoveryArtwork } from '@/modules/shared/ui/DiscoveryArtwork';
import { EditorialBanner } from '@/modules/shared/ui/EditorialBanner';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { TextField } from '@/modules/shared/ui/TextField';

export default function EventsHomeScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch live events and their categories from the backend
  const {
    data: rawEvents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: listEvents,
    staleTime: 1000 * 60 * 2,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [categories]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Upcoming events only, soonest first (events without a start time go last)
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return rawEvents
      .filter((ev) => !ev.endAt || new Date(ev.endAt).getTime() >= now)
      .slice()
      .sort((a, b) => {
        const ta = a.startAt ? new Date(a.startAt).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.startAt ? new Date(b.startAt).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((ev) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchLoc = (ev.location || '').toLowerCase().includes(q);
        const matchDesc = (ev.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }
      if (selectedCategory !== 'all' && ev.categoryId !== selectedCategory) return false;
      return true;
    });
  }, [upcomingEvents, query, selectedCategory]);

  return (
    <Screen onRefresh={onRefresh} refreshing={isRefreshing}>
      <ScreenHeader
        title="Events"
        subtitle="Find your people. Make a plan."
        back={{ fallback: '/explore' }}
        actions={
          <IconButton
            icon="heart"
            label="Saved events"
            onPress={() => router.push('/events/saved')}
            variant="plain"
          />
        }
        primaryAction={{
          label: 'Host an event',
          icon: 'plus',
          route: session ? '/events/create' : '/sign-in',
        }}
      />
      {!query && selectedCategory === 'all' ? (
        <EditorialBanner
          density="compact"
          eyebrow="MAKE TIME FOR REAL LIFE"
          title="Your next good memory."
          kind="events"
        />
      ) : null}
      <TextField
        leadingIcon="search"
        aria-label="Search events"
        placeholder="Search events, places, or interests"
        value={query}
        onChangeText={setQuery}
        trailing={
          query ? (
            <IconButton
              label="Clear event search"
              icon="close"
              variant="plain"
              onPress={() => setQuery('')}
            />
          ) : undefined
        }
      />
      <FilterChipRow label="Event categories" role="radiogroup">
        <Chip
          label="All events"
          radio
          selected={selectedCategory === 'all'}
          onPress={() => setSelectedCategory('all')}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            radio
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />
        ))}
      </FilterChipRow>
      <Section title={`Coming up (${filteredEvents.length})`}>
        {isLoading ? (
          <LoadingState variant="skeleton" />
        ) : isError ? (
          <ErrorState
            title="Unable to load events"
            body="Check your connection and try again."
            onRetry={() => void refetch()}
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            iconName="calendar"
            title={upcomingEvents.length === 0 ? 'No upcoming events yet' : 'No matching events'}
            body={
              upcomingEvents.length === 0
                ? 'Bring people together. Share an event with your community.'
                : 'Try another search or browse all categories.'
            }
            actionLabel={upcomingEvents.length === 0 ? 'Host an event' : 'Clear filters'}
            onAction={
              upcomingEvents.length === 0
                ? () => router.push(session ? '/events/create' : '/sign-in')
                : () => {
                    setQuery('');
                    setSelectedCategory('all');
                  }
            }
          />
        ) : (
          <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3, wide: 3 }}>
            {filteredEvents.map((event, index) => (
              <Card
                key={event.id}
                gap={0}
                padding={0}
                overflow="hidden"
                flexGrow={1}
                href={`/events/${event.id}`}
                aria-label={`View ${event.title}`}
              >
                <YStack backgroundColor={index === 0 ? '$artPeach' : '$artViolet'}>
                  <DiscoveryArtwork kind="events" height={120} />
                </YStack>
                <YStack padding="$x5" gap="$x3">
                  <XStack alignItems="center" flexWrap="wrap" gap="$x2">
                    {index === 0 ? <Chip label="Next up" variant="tag" /> : null}
                    {categoryName(event.categoryId) ? (
                      <Chip label={categoryName(event.categoryId) || ''} variant="tag" />
                    ) : null}
                  </XStack>
                  <AppText variant="h3">{event.title}</AppText>
                  <AppText variant="label">
                    {formatDate(event.startAt, 'weekdayTime') ?? 'Date to be announced'}
                  </AppText>
                  {event.location ? (
                    <AppText tone="muted" variant="caption">
                      {event.location}
                    </AppText>
                  ) : null}
                  {event.description ? (
                    <AppText tone="muted" variant="caption" numberOfLines={3}>
                      {event.description}
                    </AppText>
                  ) : null}
                  <AppText variant="label" tone="primary">
                    View & RSVP →
                  </AppText>
                </YStack>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </Section>
      <Card variant="filled" gap="$x3">
        <AppText variant="h4">Bring your people together.</AppText>
        <AppText tone="muted">Meetups, matches, celebrations. Make the plan.</AppText>
        <AppButton
          label="Host an event"
          size="sm"
          route={session ? '/events/create' : '/sign-in'}
        />
      </Card>
    </Screen>
  );
}
