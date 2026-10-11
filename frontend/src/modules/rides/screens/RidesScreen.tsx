import { useQuery } from '@tanstack/react-query';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { listRideOffers } from '@/modules/rides/api';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import type { Ride } from '@/modules/rides/types';
import {
  errorMessage,
  isWomenOnly,
  luggageLabel,
  recurrenceLabel,
  tollLabel,
} from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { UniversalMapView } from '@/modules/shared/components/UniversalMapView';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';
import { isPointInPolygon } from '@/modules/shared/utils/geoPolygon';

export type RidesScreenId = 'home' | 'search' | 'map' | 'filters';

const SEARCH_DELAY_MS = 300;
const MAP_HEIGHT = 480;

const WHEN_OPTIONS = [
  { id: 'any', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'Next 7 days' },
] as const;
type When = (typeof WHEN_OPTIONS)[number]['id'];

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

function departsInWindow(iso: string, when: When, now = new Date()) {
  if (when === 'any') return true;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const t = new Date(iso).getTime();
  if (when === 'today') return t >= start && t < start + day;
  if (when === 'tomorrow') return t >= start + day && t < start + 2 * day;
  return t < start + 7 * day;
}

/** Rides home, search, map and filters: upcoming active rides from `GET /rides/offers`. */
export function RidesScreen({ screenId = 'home' }: { screenId?: RidesScreenId }) {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const location = useLocationStore((s) => s.currentLocation);

  const [origin, setOrigin] = useState(typeof params.from === 'string' ? params.from : '');
  const [destination, setDestination] = useState(typeof params.to === 'string' ? params.to : '');
  const [noTolls, setNoTolls] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [luggageOnly, setLuggageOnly] = useState(false);
  const [when, setWhen] = useState<When>('any');
  const [sort, setSort] = useState<Sort>('soonest');
  const [showFilters, setShowFilters] = useState(screenId === 'filters');
  const [view, setView] = useState<'list' | 'map'>(screenId === 'map' ? 'map' : 'list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<Coordinate[] | null>(null);

  const search = useDebounced(
    { origin: origin.trim(), destination: destination.trim() },
    SEARCH_DELAY_MS,
  );

  const query = useQuery({
    queryKey: [
      'rides',
      'offers',
      search.origin,
      search.destination,
      noTolls,
      womenOnly,
      recurringOnly,
    ],
    queryFn: () =>
      listRideOffers({
        origin: search.origin || undefined,
        destination: search.destination || undefined,
        avoidTolls: noTolls || undefined,
        genderPreference: womenOnly ? 'FEMALE_ONLY' : undefined,
        isRecurring: recurringOnly ? true : undefined,
        size: 50,
      }),
  });

  const rides = useMemo(() => {
    const list = (query.data ?? []).filter((ride) => {
      if (!departsInWindow(ride.departureAt, when)) return false;
      if (luggageOnly && !['MEDIUM', 'LARGE_SUITCASE'].includes(ride.luggageCapacity ?? ''))
        return false;
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
  }, [query.data, when, luggageOnly, boundary, sort]);

  const filtersActive =
    noTolls ||
    womenOnly ||
    recurringOnly ||
    luggageOnly ||
    when !== 'any' ||
    Boolean(boundary) ||
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
    if (view === 'map')
      return (
        <RidesMap {...{ rides, selectedId, setSelectedId, boundary, setBoundary, location }} />
      );
    if (rides.length === 0) {
      return (
        <YStack gap="$x3">
          <EmptyState
            actionLabel="Offer a ride"
            body={
              filtersActive
                ? 'No upcoming rides match. Clear the filters, or offer this trip yourself.'
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
    }
    return (
      <ResponsiveGrid>
        {rides.map((ride) => (
          <RideResultCard key={ride.id} ride={ride} />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <YStack gap="$x4">
        <XStack alignItems="center" flexWrap="wrap" gap="$x3" justifyContent="space-between">
          <YStack flex={1} gap={2} minWidth={200}>
            <AppText role="heading" variant="h1">
              Rides
            </AppText>
            <AppText tone="muted" variant="caption">
              Carpools from people in your community
            </AppText>
          </YStack>
          <XStack gap="$x2">
            <IconButton
              icon="bookmark"
              label="Saved rides"
              onPress={() => router.push((isAuthenticated ? '/rides/saved' : '/sign-in') as Href)}
            />
            <IconButton
              icon="clock"
              label="Ride history"
              onPress={() => router.push((isAuthenticated ? '/rides/history' : '/sign-in') as Href)}
            />
          </XStack>
        </XStack>

        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            icon="plus"
            label="Offer a ride"
            onPress={() => router.push('/rides/offer' as Href)}
          />
          <AppButton
            icon="search"
            label="Find a ride"
            onPress={() => router.push('/rides/request' as Href)}
            variant="secondary"
          />
          <AppButton
            icon="car"
            label="My rides"
            onPress={() => router.push((isAuthenticated ? '/rides/mine' : '/sign-in') as Href)}
            variant="secondary"
          />
        </XStack>

        <Card gap="$x3" variant="outlined">
          <TextField
            label="From"
            onChangeText={setOrigin}
            placeholder="Pickup area, e.g. Irving"
            returnKeyType="search"
            value={origin}
          />
          <TextField
            label="To"
            onChangeText={setDestination}
            placeholder="Destination, e.g. Downtown"
            returnKeyType="search"
            value={destination}
          />
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton
              icon="refresh"
              label="Swap"
              onPress={() => {
                setOrigin(destination);
                setDestination(origin);
              }}
              variant="ghost"
            />
            <AppButton
              icon="filter"
              label={showFilters ? 'Hide filters' : 'Filters'}
              onPress={() => setShowFilters((v) => !v)}
              variant="ghost"
            />
            {filtersActive ? (
              <AppButton label="Clear all" onPress={resetFilters} variant="ghost" />
            ) : null}
          </XStack>
          <XStack flexWrap="wrap" gap="$x2">
            <Chip label="No tolls" onPress={() => setNoTolls((v) => !v)} selected={noTolls} />
            <Chip label="Women only" onPress={() => setWomenOnly((v) => !v)} selected={womenOnly} />
            <Chip
              label="Recurring commutes"
              onPress={() => setRecurringOnly((v) => !v)}
              selected={recurringOnly}
            />
            <Chip
              label="Luggage space"
              onPress={() => setLuggageOnly((v) => !v)}
              selected={luggageOnly}
            />
          </XStack>
          {showFilters ? (
            <YStack gap="$x3">
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
          ) : null}
        </Card>

        <SegmentedControl
          label="Results view"
          onChange={setView}
          options={[
            {
              value: 'list',
              label: query.isSuccess ? `List (${rides.length})` : 'List',
              icon: 'car',
            },
            { value: 'map', label: 'Map', icon: 'map' },
          ]}
          value={view}
        />

        {results()}
      </YStack>
    </Screen>
  );
}

function RideResultCard({ ride }: { ride: Ride }) {
  const tags = [
    ride.isRecurring ? (recurrenceLabel(ride.recurrencePattern) ?? 'Recurring') : null,
    isWomenOnly(ride.genderPreference) ? 'Women only' : null,
    tollLabel(ride.tollPreference),
    luggageLabel(ride.luggageCapacity),
    ride.distanceMiles ? `${Math.round(ride.distanceMiles)} mi` : null,
  ].filter((t): t is string => Boolean(t));
  return (
    <Card
      aria-label={`${ride.routeLabel}, departs ${formatDeparture(ride.departureAt)}, ${ride.seatsAvailable} seats open. View and book.`}
      gap="$x2"
      href={`/rides/${ride.id}`}
      variant="outlined"
    >
      <XStack alignItems="flex-start" gap="$x2" justifyContent="space-between">
        <AppText flex={1} numberOfLines={2} variant="bodyStrong">
          {ride.routeLabel}
        </AppText>
        {ride.contributionLabel ? (
          <AppText tone="primary" variant="bodyStrong">
            {ride.contributionLabel}
          </AppText>
        ) : null}
      </XStack>
      <AppText tone="muted" variant="caption">
        Departs {formatDeparture(ride.departureAt)}
      </AppText>
      <AppText tone={ride.seatsAvailable > 0 ? 'teal' : 'danger'} variant="caption">
        {ride.seatsAvailable > 0
          ? `${ride.seatsAvailable} of ${ride.seatsTotal} ${ride.seatsTotal === 1 ? 'seat' : 'seats'} open`
          : 'Full'}
      </AppText>
      {tags.length > 0 ? (
        <XStack flexWrap="wrap" gap="$x1">
          {tags.map((t) => (
            <Chip key={t} label={t} />
          ))}
        </XStack>
      ) : null}
    </Card>
  );
}

function RidesMap({
  rides,
  selectedId,
  setSelectedId,
  boundary,
  setBoundary,
  location,
}: {
  rides: Ride[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  boundary: Coordinate[] | null;
  setBoundary: (b: Coordinate[] | null) => void;
  location: { latitude: number; longitude: number };
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
      {selected ? (
        <Card gap="$x2" variant="outlined">
          <AppText variant="bodyStrong">{selected.routeLabel}</AppText>
          <AppText tone="muted" variant="caption">
            Departs {formatDeparture(selected.departureAt)} · {selected.seatsAvailable} seats open
            {selected.contributionLabel ? ` · ${selected.contributionLabel}` : ''}
          </AppText>
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton
              label="View and book"
              onPress={() => router.push(`/rides/${selected.id}` as Href)}
            />
            <AppButton label="Close" onPress={() => setSelectedId(null)} variant="ghost" />
          </XStack>
        </Card>
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
