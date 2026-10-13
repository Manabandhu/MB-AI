import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { listEvents } from '@/modules/events/api';
import { filterModules } from '@/modules/foundation/launcher/exploreFilters';
import { launcherModules } from '@/modules/foundation/launcher/moduleRegistry';
import { listJobPostings } from '@/modules/jobs/api';
import { listMarketplaceListings } from '@/modules/marketplace/api';
import { rideSearchHref } from '@/modules/rides';
import { listRoomListings } from '@/modules/rooms/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Chip } from '@/modules/shared/ui/Chip';
import { discoveryKind } from '@/modules/shared/ui/DiscoveryArtwork';
import { DiscoveryCard } from '@/modules/shared/ui/DiscoveryCard';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { TextField } from '@/modules/shared/ui/TextField';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'rides', label: 'Rides' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'events', label: 'Events' },
  { id: 'market', label: 'Marketplace' },
];
const icons: Record<string, AppIconName> = {
  Rooms: 'home',
  Events: 'calendar',
  Market: 'marketplace',
  Jobs: 'briefcase',
};

/** Immediate feature search, with listing queries loaded only when they are relevant. */
export function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const [searchQuery, setSearchQuery] = useState(
    Array.isArray(params.q) ? (params.q[0] ?? '') : (params.q ?? ''),
  );
  const [activeCategory, setActiveCategory] = useState('all');
  const deferredQuery = useDeferredValue(searchQuery);
  const hasQuery = Boolean(deferredQuery.trim());
  const enabled = (category: string) =>
    hasQuery && (activeCategory === 'all' || activeCategory === category);
  const roomsQuery = useQuery({
    queryKey: ['rooms', 'search-pool'],
    queryFn: () => listRoomListings(),
    enabled: enabled('rooms'),
  });
  const eventsQuery = useQuery({
    queryKey: ['events', 'search-pool'],
    queryFn: () => listEvents(),
    enabled: enabled('events'),
  });
  const marketQuery = useQuery({
    queryKey: ['market', 'search-pool'],
    queryFn: () => listMarketplaceListings(),
    enabled: enabled('market'),
  });
  const jobsQuery = useQuery({
    queryKey: ['jobs', 'search-pool'],
    queryFn: () => listJobPostings(),
    enabled: enabled('jobs'),
  });
  const rooms = roomsQuery.data,
    events = eventsQuery.data,
    market = marketQuery.data,
    jobs = jobsQuery.data;
  const queries = [
    { category: 'rooms', query: roomsQuery },
    { category: 'events', query: eventsQuery },
    { category: 'market', query: marketQuery },
    { category: 'jobs', query: jobsQuery },
  ].filter((item) => enabled(item.category));
  const searchFailed = queries.some((item) => item.query.isError);
  const searchLoading = queries.some((item) => item.query.isLoading);
  const features = useMemo(
    () =>
      hasQuery && activeCategory === 'all'
        ? filterModules(launcherModules, deferredQuery, 'all')
        : [],
    [hasQuery, activeCategory, deferredQuery],
  );
  const searchResults = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];

    const results: {
      id: string;
      title: string;
      subtitle: string;
      category: string;
      route: string;
      badge: string;
    }[] = [];

    if (activeCategory === 'all' || activeCategory === 'rooms') {
      (rooms ?? []).forEach((r) => {
        const loc = r.broadLocation ?? '';
        if (r.title.toLowerCase().includes(q) || loc.toLowerCase().includes(q)) {
          results.push({
            id: `room-${r.id}`,
            title: r.title,
            subtitle: [loc, `$${r.price}/mo`].filter(Boolean).join(' · '),
            category: 'Rooms',
            route: `/rooms/${r.id}`,
            badge: '🏠 Room',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'events') {
      (events ?? []).forEach((e) => {
        if (e.title.toLowerCase().includes(q) || (e.location ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `event-${e.id}`,
            title: e.title,
            subtitle: [
              e.location,
              e.startAt || e.date
                ? new Date((e.startAt ?? e.date) as string).toLocaleDateString()
                : '',
            ]
              .filter(Boolean)
              .join(' · '),
            category: 'Events',
            route: `/events/${e.id}`,
            badge: '🎉 Event',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'market') {
      (market ?? []).forEach((m) => {
        if (m.title.toLowerCase().includes(q) || (m.location ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `market-${m.id}`,
            title: m.title,
            subtitle: [m.location, `$${m.price}`].filter(Boolean).join(' · '),
            category: 'Market',
            route: `/marketplace/${m.id}`,
            badge: '🛍️ Market',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'jobs') {
      (jobs ?? []).forEach((j) => {
        if (j.title.toLowerCase().includes(q) || (j.company ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `job-${j.id}`,
            title: j.title,
            subtitle: [j.company, j.location].filter(Boolean).join(' · '),
            category: 'Jobs',
            route: `/jobs/${j.id}`,
            badge: '💼 Job',
          });
        }
      });
    }

    return results;
  }, [deferredQuery, activeCategory, rooms, events, market, jobs]);

  return (
    <Screen keyboardAvoiding>
      <ScreenHeader
        title="Find your next thing"
        subtitle="Rooms, rides, opportunities, and people. All in one place."
        back={{ fallback: '/home' }}
      />
      <TextField
        label="Search ManaBandhu"
        leadingIcon="search"
        placeholder="What are you looking for?"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        trailing={
          searchQuery ? (
            <IconButton
              icon="close"
              label="Clear search"
              variant="plain"
              onPress={() => setSearchQuery('')}
            />
          ) : undefined
        }
      />
      <FilterChipRow label="Search categories" role="radiogroup">
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.label}
            radio
            selected={activeCategory === category.id}
            onPress={() => setActiveCategory(category.id)}
          />
        ))}
      </FilterChipRow>
      {!hasQuery ? (
        <Section title="Discover by category">
          <ResponsiveGrid columns={{ compact: 2, medium: 3, expanded: 3, wide: 3 }} gap={12}>
            {launcherModules.slice(0, 6).map((module) => (
              <DiscoveryCard
                key={module.key}
                title={module.label}
                description={module.summary}
                href={module.route}
                kind={discoveryKind(module.key)}
              />
            ))}
          </ResponsiveGrid>
        </Section>
      ) : (
        <YStack gap="$x4">
          {features.length ? (
            <Section title="Features">
              {features.map((module) => (
                <ListRow
                  key={module.key}
                  title={module.label}
                  subtitle={module.summary}
                  href={module.route}
                  icon={module.icon}
                  tone={module.tone}
                />
              ))}
            </Section>
          ) : null}
          {activeCategory === 'all' || activeCategory === 'rides' ? (
            <ListRow
              title={`Find a ride for “${searchQuery.trim()}”`}
              subtitle="Choose your pickup, destination, and travel date"
              icon="car"
              href={rideSearchHref(searchQuery.trim())}
            />
          ) : null}
          {searchFailed ? (
            <ErrorState
              compact
              title="Some results couldn't load"
              body="Your available results are below. Retry to check the remaining categories."
              onRetry={() => {
                for (const item of queries) if (item.query.isError) void item.query.refetch();
              }}
            />
          ) : null}
          {searchLoading ? (
            <LoadingState variant="skeleton" count={3} label="Finding matching listings" />
          ) : null}
          {searchResults.length ? (
            <Section title="Matching listings">
              <AppText tone="muted" variant="caption" aria-live="polite">
                {searchResults.length} matches in the loaded listings
              </AppText>
              {searchResults.map((result) => (
                <ListRow
                  key={result.id}
                  title={result.title}
                  subtitle={result.subtitle}
                  meta={result.category}
                  href={result.route}
                  icon={icons[result.category] ?? 'search'}
                />
              ))}
            </Section>
          ) : !searchLoading &&
            !searchFailed &&
            activeCategory !== 'rides' &&
            features.length === 0 ? (
            <EmptyState
              title="No matches in these listings"
              body="Try a shorter phrase or another category. You can also browse every feature."
              iconName="search"
              actionLabel="Browse features"
              onAction={() => router.push('/explore' as Href)}
              secondaryActionLabel="Clear search"
              onSecondaryAction={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            />
          ) : null}
        </YStack>
      )}
    </Screen>
  );
}
