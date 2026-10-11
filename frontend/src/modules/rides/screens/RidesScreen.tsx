import { useInfiniteQuery } from '@tanstack/react-query';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { listRideOffersPage } from '@/modules/rides/api';
import { formatDeparture, RideCard } from '@/modules/rides/components/RideCard';
import { RideLocationPicker } from '@/modules/rides/components/RideLocationPicker';
import { useSavedRides } from '@/modules/rides/hooks/useSavedRides';
import type { Ride } from '@/modules/rides/types';
import {
  type DepartureWindow,
  departsInWindow,
  errorMessage,
  hasLuggageSpace,
} from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { UniversalMapView } from '@/modules/shared/components/UniversalMapView';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';
import { isPointInPolygon } from '@/modules/shared/utils/geoPolygon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export type RidesScreenId = 'home' | 'search' | 'map' | 'filters';

const SEARCH_DELAY_MS = 300;
const PAGE_SIZE = 50;
const MAP_HEIGHT = 480;

const WHEN_OPTIONS: { id: DepartureWindow; label: string }[] = [
  { id: 'any', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'Next 7 days' },
];

const SORT_OPTIONS = [
  { id: 'soonest', label: 'Soonest' },
  { id: 'cheapest', label: 'Lowest price' },
  { id: 'seats', label: 'Most seats' },
] as const;
type Sort = (typeof SORT_OPTIONS)[number]['id'];

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const param = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

/**
 * Rides home, search, map and filters: upcoming active rides from `GET /rides/offers`, 50 per page. Origin,
 * destination, tolls, women-only and recurring are server filters; the departure window, luggage and a drawn area
 * filter the pages loaded so far, and the screen says so while more pages exist.
 */
export function RidesScreen({ screenId = 'home' }: { screenId?: RidesScreenId }) {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const location = useLocationStore((s) => s.currentLocation);
  const { isDualPane } = useAdaptiveLayout();
  const saved = useSavedRides();

  const [origin, setOrigin] = useState(param(params.from));
  const [destination, setDestination] = useState(param(params.to));
  const [noTolls, setNoTolls] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [luggageOnly, setLuggageOnly] = useState(false);
  const [when, setWhen] = useState<DepartureWindow>('any');
  const [sort, setSort] = useState<Sort>('soonest');
  const [sheetOpen, setSheetOpen] = useState(screenId === 'filters');
  const [view, setView] = useState<'list' | 'map'>(screenId === 'map' ? 'map' : 'list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<Coordinate[] | null>(null);

  // Deep links (`/rides/search?from=&to=`) can change while the screen stays mounted.
  useEffect(() => {
    if (params.from !== undefined) setOrigin(param(params.from));
    if (params.to !== undefined) setDestination(param(params.to));
  }, [params.from, params.to]);

  const search = useDebounced(
    { origin: origin.trim(), destination: destination.trim() },
    SEARCH_DELAY_MS,
  );

  const query = useInfiniteQuery({
    queryKey: [
      'rides',
      'offers',
      search.origin,
      search.destination,
      noTolls,
      womenOnly,
      recurringOnly,
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listRideOffersPage({
        origin: search.origin || undefined,
        destination: search.destination || undefined,
        avoidTolls: noTolls || undefined,
        genderPreference: womenOnly ? 'FEMALE_ONLY' : undefined,
        isRecurring: recurringOnly ? true : undefined,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const loaded = useMemo(() => {
    const seen = new Set<string>();
    const out: Ride[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const ride of page.rides) {
        if (seen.has(ride.id)) continue;
        seen.add(ride.id);
        out.push(ride);
      }
    }
    return out;
  }, [query.data]);
  const total = query.data?.pages[0]?.total ?? null;

  const rides = useMemo(() => {
    const list = loaded.filter((ride) => {
      if (!departsInWindow(ride.departureAt, when)) return false;
      if (luggageOnly && !hasLuggageSpace(ride.luggageCapacity)) return false;
      if (boundary && boundary.length >= 3) {
        if (ride.originLat == null || ride.originLng == null) return false;
        if (!isPointInPolygon({ latitude: ride.originLat, longitude: ride.originLng }, boundary))
          return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'cheapest') {
        return (a.contributionAmount ?? Infinity) - (b.contributionAmount ?? Infinity);
      }
      if (sort === 'seats') return b.seatsAvailable - a.seatsAvailable;
      return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
    });
  }, [loaded, when, luggageOnly, boundary, sort]);

  const clientFilters = luggageOnly || when !== 'any' || Boolean(boundary);
  const filtersActive =
    noTolls ||
    womenOnly ||
    recurringOnly ||
    clientFilters ||
    Boolean(origin.trim() || destination.trim());

  const resetFilters = () => {
    setOrigin('');
    setDestination('');
    setNoTolls(false);
    setWomenOnly(false);
    setRecurringOnly(false);
    setLuggageOnly(false);
    setWhen('any');
    setBoundary(null);
  };

  const whenLabel = WHEN_OPTIONS.find((o) => o.id === when)?.label ?? 'Any time';
  const sortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? 'Soonest';
  const go = (route: string) => router.push((isAuthenticated ? route : '/sign-in') as Href);

  const pagingNotice = query.hasNextPage ? (
    <Card gap="$x2" variant="filled">
      <AppText variant="caption">
        Showing the first {loaded.length}
        {total != null ? ` of ${total}` : ''} matching rides.
        {clientFilters
          ? ' The When, Luggage and drawn-area filters only check rides loaded so far.'
          : ''}
      </AppText>
      <XStack>
        <AppButton
          icon="refresh"
          label="Load more rides"
          loading={query.isFetchingNextPage}
          onPress={() => query.fetchNextPage()}
          size="sm"
          variant="secondary"
        />
      </XStack>
    </Card>
  ) : null;

  const emptyState = (
    <YStack gap="$x3">
      <EmptyState
        actionLabel="Offer a ride"
        body={
          filtersActive
            ? query.hasNextPage
              ? 'None of the rides loaded so far match. Load more, clear the filters, or offer this trip yourself.'
              : 'No upcoming rides match. Clear the filters, or offer this trip yourself.'
            : 'No one has offered an upcoming ride yet. Offer yours and riders can book it.'
        }
        iconName="car"
        onAction={() => router.push('/rides/offer' as Href)}
        title={filtersActive ? 'No rides match' : 'No upcoming rides'}
      />
      {filtersActive ? (
        <XStack justifyContent="center">
          <AppButton label="Clear filters" onPress={resetFilters} variant="ghost" />
        </XStack>
      ) : null}
    </YStack>
  );

  const list = (columns?: number) =>
    rides.length === 0 ? (
      emptyState
    ) : (
      <ResponsiveGrid
        columns={
          columns ? { compact: 1, medium: columns, expanded: columns, wide: columns } : undefined
        }
      >
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            onToggleSave={() => saved.toggle(ride.id)}
            ride={ride}
            saved={saved.isSaved(ride.id)}
            saving={saved.pendingId === ride.id}
            selected={selectedId === ride.id}
          />
        ))}
      </ResponsiveGrid>
    );

  const map = (
    <RidesMap
      {...{ rides, selectedId, setSelectedId, boundary, setBoundary, location }}
      showSelection={!isDualPane}
    />
  );

  const results = () => {
    if (query.isLoading) {
      return <LoadingState count={3} label="Loading rides…" variant="skeleton" />;
    }
    if (query.isError) {
      return (
        <ErrorState
          body={errorMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel="Retry"
          title="Could not load rides"
        />
      );
    }
    if (isDualPane) {
      // Side by side on wide windows: the list scrolls with the page, the map stays beside it.
      return (
        <XStack alignItems="flex-start" gap="$x4">
          <YStack flex={1} gap="$x3" minWidth={0}>
            {list(1)}
            {pagingNotice}
          </YStack>
          <YStack flex={1} minWidth={0}>
            {map}
          </YStack>
        </XStack>
      );
    }
    return (
      <YStack gap="$x3">
        {view === 'map' ? map : list()}
        {pagingNotice}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          actions={
            <>
              <IconButton icon="car" label="My rides" onPress={() => go('/rides/mine')} />
              <IconButton icon="heart" label="Saved rides" onPress={() => go('/rides/saved')} />
              <IconButton icon="clock" label="Ride history" onPress={() => go('/rides/history')} />
            </>
          }
          back={{ fallback: '/' as Href }}
          primaryAction={{ label: 'Offer a ride', icon: 'plus', route: '/rides/offer' as Href }}
          subtitle="Carpools from people in your community"
          title="Rides"
        />

        <Card gap="$x2" variant="outlined">
          <XStack alignItems="flex-end" gap="$x2">
            <YStack flex={1} gap="$x2" minWidth={0}>
              <RideLocationPicker
                label="From"
                onCoordsChange={() => undefined}
                onValueChange={setOrigin}
                placeholder="Pickup area, e.g. Irving"
                value={origin}
              />
              <RideLocationPicker
                label="To"
                onCoordsChange={() => undefined}
                onValueChange={setDestination}
                placeholder="Destination, e.g. Downtown"
                value={destination}
              />
            </YStack>
            <YStack paddingBottom="$x6">
              <IconButton
                icon="swap"
                label="Swap pickup and destination"
                onPress={() => {
                  setOrigin(destination);
                  setDestination(origin);
                }}
              />
            </YStack>
          </XStack>
        </Card>

        <FilterChipRow label="Ride filters">
          <Chip
            accessibilityLabel={`Departs: ${whenLabel}. Change`}
            icon="calendar"
            label={`${when === 'any' ? 'When' : whenLabel} ▾`}
            onPress={() => setSheetOpen(true)}
            selected={when !== 'any'}
          />
          <Chip label="Women only" onPress={() => setWomenOnly((v) => !v)} selected={womenOnly} />
          <Chip label="No tolls" onPress={() => setNoTolls((v) => !v)} selected={noTolls} />
          <Chip
            icon="repeat"
            label="Recurring"
            onPress={() => setRecurringOnly((v) => !v)}
            selected={recurringOnly}
          />
          <Chip
            icon="package"
            label="Luggage"
            onPress={() => setLuggageOnly((v) => !v)}
            selected={luggageOnly}
          />
          <Chip
            accessibilityLabel={`Sort: ${sortLabel}. Change`}
            icon="filter-list"
            label={`${sortLabel} ▾`}
            onPress={() => setSheetOpen(true)}
            selected={sort !== 'soonest'}
          />
          {filtersActive ? <Chip icon="close" label="Clear all" onPress={resetFilters} /> : null}
        </FilterChipRow>

        {isDualPane ? (
          query.isSuccess ? (
            <AppText aria-live="polite" tone="muted" variant="caption">
              {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
            </AppText>
          ) : null
        ) : (
          <SegmentedControl
            label="Results view"
            onChange={setView}
            options={[
              {
                value: 'list',
                label: 'List',
                icon: 'list',
                count: query.isSuccess ? rides.length : undefined,
              },
              { value: 'map', label: 'Map', icon: 'map' },
            ]}
            value={view}
          />
        )}

        {results()}
      </YStack>

      <BottomSheet
        onClose={() => setSheetOpen(false)}
        scrollable
        title="When and sort"
        visible={sheetOpen}
      >
        <YStack gap="$x4" paddingBottom="$x2">
          <YStack gap="$x2">
            <AppText variant="label">Departs</AppText>
            <XStack aria-label="Departs" flexWrap="wrap" gap="$x2" role="radiogroup">
              {WHEN_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  onPress={() => setWhen(o.id)}
                  radio
                  selected={when === o.id}
                />
              ))}
            </XStack>
          </YStack>
          <YStack gap="$x2">
            <AppText variant="label">Sort by</AppText>
            <XStack aria-label="Sort by" flexWrap="wrap" gap="$x2" role="radiogroup">
              {SORT_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  onPress={() => setSort(o.id)}
                  radio
                  selected={sort === o.id}
                />
              ))}
            </XStack>
          </YStack>
          <AppButton fullWidth label="Show rides" onPress={() => setSheetOpen(false)} />
        </YStack>
      </BottomSheet>
    </Screen>
  );
}

function RidesMap({
  rides,
  selectedId,
  setSelectedId,
  boundary,
  setBoundary,
  location,
  showSelection,
}: {
  rides: Ride[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  boundary: Coordinate[] | null;
  setBoundary: (b: Coordinate[] | null) => void;
  location: { latitude: number; longitude: number };
  /** Show the selected ride under the map (single pane; on dual pane the list highlights it). */
  showSelection: boolean;
}) {
  const markers = rides
    .filter((r) => r.originLat != null && r.originLng != null)
    .map((r) => ({
      id: r.id,
      latitude: r.originLat as number,
      longitude: r.originLng as number,
      title: r.routeLabel,
      price: r.contributionAmount != null ? r.contributionAmount : undefined,
      subtitle: formatDeparture(r.departureAt),
      isSelected: selectedId === r.id,
    }));
  const selected = rides.find((r) => r.id === selectedId) ?? null;
  return (
    <YStack gap="$x3">
      <AppText tone="muted" variant="caption">
        Pins show approximate pickup areas ({markers.length} of {rides.length} rides have a map
        position). Draw an area to filter by pickup.
      </AppText>
      <YStack borderRadius="$card" height={MAP_HEIGHT} overflow="hidden">
        <UniversalMapView
          drawnPolygon={boundary}
          enableDrawing
          initialRegion={{
            latitude: markers[0]?.latitude ?? location.latitude,
            longitude: markers[0]?.longitude ?? location.longitude,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}
          markers={markers}
          onClearPolygon={() => setBoundary(null)}
          onPolygonComplete={(poly) => setBoundary(poly)}
          onSelectMarker={(id) => setSelectedId(id)}
          selectedMarkerId={selectedId}
          style={StyleSheet.absoluteFill}
        />
      </YStack>
      {showSelection && selected ? (
        <YStack gap="$x2">
          <RideCard ride={selected} selected />
          <XStack>
            <AppButton
              label="Close"
              onPress={() => setSelectedId(null)}
              size="sm"
              variant="ghost"
            />
          </XStack>
        </YStack>
      ) : null}
      {rides.length === 0 ? (
        <EmptyState
          actionLabel="Offer a ride"
          body="No upcoming rides match these filters."
          compact
          iconName="map"
          onAction={() => router.push('/rides/offer' as Href)}
          title="No rides on the map"
        />
      ) : null}
    </YStack>
  );
}
