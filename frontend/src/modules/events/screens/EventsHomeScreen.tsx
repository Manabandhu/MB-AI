import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { listEventCategories, listEvents } from '@/modules/events/api';
import {
  AppButton,
  AppIcon,
  type AppIconName,
  AppText,
  Card,
  Chip,
  FilterChipRow,
  Heading,
  IconButton,
  ResponsiveGrid,
  Screen,
  ScreenHeader,
  StatusBadge,
  TextField,
} from '@/modules/shared/ui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { useAppearance } from '@/theme/ThemeProvider';

function MetaLine({ icon, children }: { icon: AppIconName; children: string }) {
  const { palette } = useAppearance();
  return (
    <XStack alignItems="center" gap="$x2">
      <AppIcon color={palette.muted} name={icon} size={16} />
      <AppText flex={1} numberOfLines={1} tone="muted" variant="label">
        {children}
      </AppText>
    </XStack>
  );
}

export default function EventsHomeScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { palette } = useAppearance();

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

  const hostEvent = () => router.push((session ? '/events/create' : '/sign-in') as Href);

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

  // The spotlight is simply the next upcoming event that matches the current filters.
  const featuredEvent = filteredEvents[0];
  const regularEvents = filteredEvents.slice(1);

  return (
    <Screen onRefresh={onRefresh} refreshing={isRefreshing}>
      <ScreenHeader
        actions={
          <IconButton
            icon="heart"
            label="Saved events"
            onPress={() => router.push('/events/saved' as Href)}
          />
        }
        back={{ fallback: '/home' as Href }}
        primaryAction={{ label: 'Host', icon: 'plus', onPress: hostEvent }}
        subtitle={
          isLoading || isError
            ? 'Community events'
            : `${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`
        }
        title="Events"
      />

      <TextField
        aria-label="Search events"
        leadingIcon="search"
        onChangeText={setQuery}
        placeholder="Search events by name, place, or description..."
        trailing={
          query.length > 0 ? (
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

      <FilterChipRow label="Event category" role="radiogroup">
        {[{ id: 'all', name: 'All Events' }, ...categories].map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onPress={() => setSelectedCategory(cat.id)}
            radio
            selected={selectedCategory === cat.id}
          />
        ))}
      </FilterChipRow>

      {isLoading ? (
        <LoadingState label="Loading events..." />
      ) : isError ? (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => refetch()}
          retryLabel="Retry"
          title="Unable to load events"
        />
      ) : !featuredEvent ? (
        <EmptyState
          actionLabel="View All Events"
          body={
            upcomingEvents.length === 0
              ? 'Host one to get the community together.'
              : 'Try searching for a different keyword or category.'
          }
          iconName="event"
          onAction={() => {
            setQuery('');
            setSelectedCategory('all');
          }}
          title={upcomingEvents.length === 0 ? 'No upcoming events yet' : 'No events found'}
        />
      ) : (
        <>
          {/* Next upcoming event spotlight (first real event in the filtered list) */}
          <Card gap="$x3" variant="tinted">
            <XStack flexWrap="wrap" gap="$x2">
              <StatusBadge icon="sparks" label="Next up" tone="warning" />
              {categoryName(featuredEvent.categoryId) ? (
                <Chip label={categoryName(featuredEvent.categoryId) as string} variant="tag" />
              ) : null}
            </XStack>
            <Heading variant="h3">{featuredEvent.title}</Heading>
            <YStack gap="$x1">
              <MetaLine icon="calendar">
                {formatDate(featuredEvent.startAt, 'weekdayTime') ?? 'Date to be announced'}
              </MetaLine>
              <MetaLine icon="map-pin">{featuredEvent.location}</MetaLine>
            </YStack>
            <XStack>
              <AppButton
                icon="arrow-right"
                label="View & RSVP"
                route={`/events/${featuredEvent.id}`}
                variant="secondary"
              />
            </XStack>
          </Card>

          {regularEvents.length > 0 ? (
            <YStack gap="$x3">
              <Heading variant="h4">More upcoming ({regularEvents.length})</Heading>
              <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3, wide: 3 }}>
                {regularEvents.map((event) => {
                  const category = categoryName(event.categoryId);
                  return (
                    <Card
                      aria-label={`${event.title}, view details`}
                      gap="$x2"
                      href={`/events/${event.id}`}
                      key={event.id}
                    >
                      {category ? (
                        <XStack>
                          <Chip label={category} variant="tag" />
                        </XStack>
                      ) : null}
                      <AppText variant="bodyStrong">{event.title}</AppText>
                      <MetaLine icon="calendar">
                        {formatDate(event.startAt, 'weekdayTime') ?? 'Date to be announced'}
                      </MetaLine>
                      <MetaLine icon="map-pin">{event.location}</MetaLine>
                      {event.description ? (
                        <AppText numberOfLines={2} tone="muted" variant="caption">
                          {event.description}
                        </AppText>
                      ) : null}
                      <XStack alignItems="center" gap="$x1">
                        <AppText tone="primary" variant="label">
                          View details
                        </AppText>
                        <AppIcon color={palette.primary} name="chevron-right" size={16} />
                      </XStack>
                    </Card>
                  );
                })}
              </ResponsiveGrid>
            </YStack>
          ) : null}
        </>
      )}

      {/* Community host prompt */}
      <Card variant="filled">
        <XStack alignItems="center" flexWrap="wrap" gap="$x3">
          <YStack
            alignItems="center"
            backgroundColor="$primaryTint"
            borderRadius="$control"
            height={44}
            justifyContent="center"
            width={44}
          >
            <AppIcon color={palette.primary} name="community" size={22} />
          </YStack>
          <YStack flex={1} flexBasis={200} gap="$x1">
            <AppText variant="bodyStrong">Hosting a Community Event?</AppText>
            <AppText tone="muted" variant="caption">
              Publish your festival puja, cricket match, garba night, or tech meetup for the
              community.
            </AppText>
          </YStack>
          <AppButton label="Create Event" onPress={hostEvent} size="sm" variant="secondary" />
        </XStack>
      </Card>
    </Screen>
  );
}
