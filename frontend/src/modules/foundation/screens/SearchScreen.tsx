import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import type { Event } from '@/modules/events/api';
import { listEvents } from '@/modules/events/api';
import { rankSearchResults, type SearchFields } from '@/modules/foundation/search/rankSearch';
import { listJobPostings } from '@/modules/jobs/api';
import type { JobPosting } from '@/modules/jobs/types';
import { listMarketplaceListings } from '@/modules/marketplace/api';
import type { MarketplaceListing } from '@/modules/marketplace/types';
import { formatListingPrice } from '@/modules/marketplace/utils/format';
import { rideSearchHref } from '@/modules/rides';
import { listRoomListings } from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import {
  type AppIconName,
  AppText,
  BackButton,
  Card,
  Chip,
  FilterChipRow,
  IconButton,
  ListRow,
  Screen,
  Section,
  SkeletonCard,
  TextField,
} from '@/modules/shared/ui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { useAdaptiveLayout } from '@/platform/adaptive';

type CategoryId = 'all' | 'rooms' | 'rides' | 'jobs' | 'events' | 'market';

const CATEGORIES: { id: CategoryId; label: string; icon?: AppIconName }[] = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms', icon: 'bed' },
  { id: 'rides', label: 'Rides', icon: 'car' },
  { id: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { id: 'events', label: 'Events', icon: 'event' },
  { id: 'market', label: 'Market', icon: 'marketplace' },
];

const QUICK_LINKS: { label: string; icon: AppIconName; route: string }[] = [
  { label: 'Rooms', icon: 'home', route: '/rooms' },
  { label: 'Rides', icon: 'car', route: '/rides' },
  { label: 'Jobs', icon: 'briefcase', route: '/jobs' },
  { label: 'Events', icon: 'calendar', route: '/events' },
  { label: 'Marketplace', icon: 'marketplace', route: '/marketplace' },
  { label: 'Safety Center', icon: 'shield', route: '/safety' },
];

type Result = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: AppIconName;
  kind: string;
  fields: SearchFields;
};

type Source = {
  id: Exclude<CategoryId, 'all' | 'rides'>;
  label: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  results: Result[];
};

function eventDate(e: Event) {
  return formatDate(e.startAt) ?? '';
}

/**
 * Searches rooms, events, marketplace, and jobs (the lists each module already serves) and links to ride search.
 * Each source loads and fails on its own: a failing list shows its own retry while the others still show results.
 * Results are ranked title > location > secondary text > description.
 */
export function SearchScreen() {
  const { windowClass } = useAdaptiveLayout();
  // `/search?q=…` (e.g. from Explore's empty state) starts with that query filled in.
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQuery = Array.isArray(params.q) ? (params.q[0] ?? '') : (params.q ?? '');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const query = searchQuery.trim();

  const roomsQuery = useQuery<RoomListing[]>({
    queryKey: ['rooms', 'search-pool'],
    queryFn: () => listRoomListings(),
  });
  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events', 'search-pool'],
    queryFn: () => listEvents(),
  });
  const marketQuery = useQuery<MarketplaceListing[]>({
    queryKey: ['market', 'search-pool'],
    queryFn: () => listMarketplaceListings(),
  });
  const jobsQuery = useQuery<JobPosting[]>({
    queryKey: ['jobs', 'search-pool'],
    queryFn: () => listJobPostings(),
  });

  const sources: Source[] = (() => {
    const rooms: Result[] = (roomsQuery.data ?? []).map((r) => ({
      id: `room-${r.id}`,
      title: r.title,
      subtitle: [r.broadLocation, `${formatListingPrice(r.price)}/mo`].filter(Boolean).join(' · '),
      route: `/rooms/${r.id}`,
      icon: 'bed',
      kind: 'Room',
      fields: { title: r.title, location: r.broadLocation, description: r.description },
    }));
    const events: Result[] = (eventsQuery.data ?? []).map((e) => ({
      id: `event-${e.id}`,
      title: e.title,
      subtitle: [e.location, eventDate(e)].filter(Boolean).join(' · '),
      route: `/events/${e.id}`,
      icon: 'event',
      kind: 'Event',
      fields: { title: e.title, location: e.location, description: e.description },
    }));
    const market: Result[] = (marketQuery.data ?? []).map((m) => ({
      id: `market-${m.id}`,
      title: m.title,
      subtitle: [m.location, formatListingPrice(m.price, m.currency)].filter(Boolean).join(' · '),
      route: `/marketplace/${m.id}`,
      icon: 'marketplace',
      kind: 'Marketplace',
      fields: { title: m.title, location: m.location, description: m.description },
    }));
    const jobs: Result[] = (jobsQuery.data ?? []).map((j) => ({
      id: `job-${j.id}`,
      title: j.title,
      subtitle: [j.company, j.location].filter(Boolean).join(' · '),
      route: `/jobs/${j.id}`,
      icon: 'briefcase',
      kind: 'Job',
      fields: {
        title: j.title,
        location: j.location,
        secondary: j.company,
        description: j.description,
      },
    }));
    const from = (
      q: typeof roomsQuery | typeof eventsQuery | typeof marketQuery | typeof jobsQuery,
    ) => ({
      isLoading: q.isLoading,
      isError: q.isError,
      refetch: () => void q.refetch(),
    });
    return [
      { id: 'rooms', label: 'Rooms', results: rooms, ...from(roomsQuery) },
      { id: 'events', label: 'Events', results: events, ...from(eventsQuery) },
      { id: 'market', label: 'Marketplace', results: market, ...from(marketQuery) },
      { id: 'jobs', label: 'Jobs', results: jobs, ...from(jobsQuery) },
    ];
  })();

  const activeSources = sources.filter(
    (source) => activeCategory === 'all' || activeCategory === source.id,
  );
  const results = query
    ? rankSearchResults(
        query,
        activeSources.flatMap((source) => source.results),
        (r) => r.fields,
      )
    : [];
  const failed = activeSources.filter((source) => source.isError);
  const loading = activeSources.filter((source) => source.isLoading);
  const showRides = query.length > 0 && (activeCategory === 'all' || activeCategory === 'rides');

  const header = (
    <YStack
      alignSelf="center"
      gap="$x2"
      maxWidth={880}
      paddingHorizontal={windowClass === 'compact' ? 16 : 24}
      paddingTop="$x2"
      width="100%"
    >
      <XStack alignItems="center" gap="$x2">
        <BackButton fallback="/explore" />
        <YStack flex={1}>
          <TextField
            autoCorrect={false}
            autoFocus
            leadingIcon="search"
            onChangeText={setSearchQuery}
            placeholder="Search rooms, rides, jobs, events…"
            returnKeyType="search"
            trailing={
              searchQuery.length > 0 ? (
                <IconButton
                  icon="close"
                  label="Clear search"
                  onPress={() => setSearchQuery('')}
                  variant="plain"
                />
              ) : undefined
            }
            value={searchQuery}
          />
        </YStack>
      </XStack>
      <FilterChipRow label="Search in" role="radiogroup">
        {CATEGORIES.map((cat) => (
          <Chip
            icon={cat.icon}
            key={cat.id}
            label={cat.label}
            onPress={() => setActiveCategory(cat.id)}
            radio
            selected={activeCategory === cat.id}
          />
        ))}
      </FilterChipRow>
    </YStack>
  );

  if (!query) {
    return (
      <Screen header={header}>
        <Section title="Jump to">
          <YStack gap="$x2">
            {QUICK_LINKS.map((link) => (
              <ListRow href={link.route} icon={link.icon} key={link.route} title={link.label} />
            ))}
          </YStack>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      {showRides ? (
        // Rides are searched by route on the rides screen, so this is a suggestion, not a result.
        <ListRow
          href={rideSearchHref(searchQuery)}
          icon="car"
          subtitle="Search upcoming carpools for this route"
          title={`Rides: ${query}`}
          tone="teal"
        />
      ) : null}

      {failed.map((source) => (
        <Card key={source.id} variant="filled">
          <ErrorState
            body="Results from other sections are still shown."
            compact
            onRetry={source.refetch}
            title={`${source.label} couldn't be searched`}
          />
        </Card>
      ))}

      {results.length > 0 ? (
        <Section title={`${results.length} ${results.length === 1 ? 'result' : 'results'}`}>
          <YStack gap="$x2">
            {results.map((item) => (
              <ListRow
                href={item.route}
                icon={item.icon}
                key={item.id}
                meta={item.kind}
                subtitle={item.subtitle}
                title={item.title}
              />
            ))}
          </YStack>
        </Section>
      ) : null}

      {loading.length > 0 ? (
        <YStack aria-label={`Searching ${loading.map((s) => s.label).join(', ')}`} gap="$x2">
          <AppText tone="muted" variant="caption">
            Still searching {loading.map((s) => s.label.toLowerCase()).join(', ')}…
          </AppText>
          <SkeletonCard lines={2} />
        </YStack>
      ) : null}

      {results.length === 0 && loading.length === 0 && failed.length < activeSources.length ? (
        <EmptyState
          body={
            activeCategory === 'all'
              ? 'Try broader words, a city name, or check the spelling.'
              : 'Try broader words, or search all sections.'
          }
          iconName="search"
          onAction={activeCategory === 'all' ? undefined : () => setActiveCategory('all')}
          actionLabel={activeCategory === 'all' ? undefined : 'Search everything'}
          title={`No results for "${query}"`}
        />
      ) : null}
    </Screen>
  );
}
