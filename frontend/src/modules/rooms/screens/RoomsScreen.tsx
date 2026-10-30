import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { ALL_USA_LOCATION, useLocationStore } from '@/lib/locationStore';
import { listRoomListings } from '@/modules/rooms/api';
import { CityPickerSheet } from '@/modules/rooms/components/CityPickerSheet';
import { RoomCard } from '@/modules/rooms/components/RoomCard';
import { RoomFilterSheet } from '@/modules/rooms/components/RoomFilterSheet';
import { RoomsMap } from '@/modules/rooms/components/RoomsMap';
import { useFilteredRooms, useRoomFilters } from '@/modules/rooms/hooks/useRoomFilters';
import { useRoomSave } from '@/modules/rooms/hooks/useRoomSave';
import type { RoomListing } from '@/modules/rooms/types';
import {
  FURNISHED_AMENITY,
  hasArea,
  isAllCities,
  QUICK_MAX_PRICE,
  roomCoordinate,
  SORT_OPTIONS,
  toggleAmenity,
} from '@/modules/rooms/utils/roomFilters';
import { formatAmount } from '@/modules/rooms/utils/roomFormat';
import { errorMessage } from '@/modules/rooms/utils/roomLabels';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Chip } from '@/modules/shared/ui/Chip';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';

export type RoomsScreenId = 'home' | 'search' | 'map' | 'filters';

/** The backend caps a page at 500; city matching and filters run on the client over this set. */
const LISTING_LIMIT = 500;
const GRID_GAP = 16;
const SCREEN_BOTTOM_GAP = 32;

type ViewMode = 'list' | 'map';

/**
 * Room discovery. `/rooms/search` focuses the search field, `/rooms/map` opens the map, and `/rooms/filters` opens the
 * filter sheet (closing it goes to `/rooms`). Quick chips, the sheet and the drawn map area share one filter state.
 */
export function RoomsScreen({ screenId }: { screenId: RoomsScreenId }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppearance();
  const { columns, maxContentWidth, width, windowClass } = useAdaptiveLayout();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const city = useLocationStore((s) => s.currentLocation);
  const setCity = useLocationStore((s) => s.setLocation);
  const detectedLocation = useLocationStore((s) => s.detectedLocation);
  const detectDeviceLocation = useLocationStore((s) => s.detectDeviceLocation);
  const { filters, update, reset, activeCount, isFiltered } = useRoomFilters();
  const { isSaved, toggle } = useRoomSave();

  const [view, setView] = useState<ViewMode>(screenId === 'map' ? 'map' : 'list');
  const [filtersOpen, setFiltersOpen] = useState(screenId === 'filters');
  const [cityOpen, setCityOpen] = useState(false);
  const [pulling, setPulling] = useState(false);

  // Suggest the device's city once; the member can still pick any other city.
  useEffect(() => {
    if (!detectedLocation) detectDeviceLocation();
  }, [detectedLocation, detectDeviceLocation]);

  // The request does not depend on the city (matching runs on the client), so neither does the key.
  const listingsQuery = useQuery({
    queryKey: ['rooms', 'listings', { size: LISTING_LIMIT }],
    queryFn: () => listRoomListings({ size: LISTING_LIMIT }),
    retry: 1,
  });
  const { cityRooms, results } = useFilteredRooms(listingsQuery.data, city, filters);
  const loaded = listingsQuery.isSuccess;
  const mappedCount = results.filter((r) => roomCoordinate(r) !== null).length;
  const cityLabel = isAllCities(city) ? 'All cities' : city.name;

  const refresh = useCallback(async () => {
    setPulling(true);
    try {
      await listingsQuery.refetch();
    } finally {
      setPulling(false);
    }
  }, [listingsQuery]);

  const go = (route: string) => router.push((signedIn ? route : '/sign-in') as Href);

  const closeFilters = () => {
    setFiltersOpen(false);
    if (screenId === 'filters') router.replace('/rooms' as Href);
  };

  const header = (
    <YStack gap="$x4" paddingBottom="$x4">
      <ScreenHeader
        actions={
          <>
            <Chip
              accessibilityLabel={`City: ${cityLabel}. Change city`}
              icon="map-pin"
              label={cityLabel}
              onPress={() => setCityOpen(true)}
            />
            <IconButton
              icon="heart"
              label="Saved rooms"
              onPress={() => go('/rooms/saved')}
              variant="plain"
            />
            <IconButton
              icon="home"
              label="My listings"
              onPress={() => go('/rooms/my-listings')}
              variant="plain"
            />
          </>
        }
        back={{ fallback: '/home' as Href }}
        primaryAction={{
          icon: 'plus',
          label: 'Post a room',
          onPress: () => go('/rooms/create-listing'),
        }}
        subtitle="Rooms and shared homes from the community"
        title="Rooms"
      />

      <XStack alignItems="flex-end" gap="$x2">
        <YStack flex={1}>
          <TextField
            aria-label="Search rooms"
            autoFocus={screenId === 'search'}
            onChangeText={(query) => update({ query })}
            placeholder="Search by title, area or room type"
            returnKeyType="search"
            value={filters.query}
          />
        </YStack>
        {filters.query ? (
          <IconButton icon="close" label="Clear search" onPress={() => update({ query: '' })} />
        ) : null}
      </XStack>

      <FilterChipRow label="Quick filters">
        <Chip
          accessibilityLabel={
            activeCount > 0 ? `Filters and sort, ${activeCount} active` : 'Filters and sort'
          }
          icon="filter"
          label={activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
          onPress={() => setFiltersOpen(true)}
          selected={activeCount > 0}
        />
        <Chip
          label="Pure veg"
          onPress={() => update({ diet: filters.diet === 'pure_veg' ? null : 'pure_veg' })}
          selected={filters.diet === 'pure_veg'}
        />
        <Chip
          label="Private bath"
          onPress={() => update({ privateBath: !filters.privateBath })}
          selected={filters.privateBath}
        />
        <Chip
          label="Female only"
          onPress={() =>
            update({ gender: filters.gender === 'FEMALE_ONLY' ? null : 'FEMALE_ONLY' })
          }
          selected={filters.gender === 'FEMALE_ONLY'}
        />
        <Chip
          label={`Under ${formatAmount(QUICK_MAX_PRICE)}`}
          onPress={() =>
            update({ maxPrice: filters.maxPrice === QUICK_MAX_PRICE ? null : QUICK_MAX_PRICE })
          }
          selected={filters.maxPrice === QUICK_MAX_PRICE}
        />
        <Chip
          label="Furnished"
          onPress={() => update({ amenities: toggleAmenity(filters.amenities, FURNISHED_AMENITY) })}
          selected={filters.amenities.includes(FURNISHED_AMENITY)}
        />
        {hasArea(filters.area) ? (
          <Chip
            accessibilityLabel="Drawn map area. Clear it"
            icon="close"
            label="Drawn area"
            onPress={() => update({ area: null })}
            selected
          />
        ) : null}
      </FilterChipRow>

      <SegmentedControl
        label="View"
        onChange={setView}
        options={[
          {
            value: 'list',
            label: 'List',
            icon: 'list',
            count: loaded ? results.length : undefined,
          },
          { value: 'map', label: 'Map', icon: 'map', count: loaded ? mappedCount : undefined },
        ]}
        value={view}
      />

      {loaded && view === 'list' ? (
        <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
          <AppText aria-live="polite" flex={1} minWidth={160} tone="muted" variant="label">
            {results.length} {results.length === 1 ? 'room' : 'rooms'} in {cityLabel} ·{' '}
            {SORT_OPTIONS.find((o) => o.id === filters.sort)?.label}
          </AppText>
          {isFiltered ? (
            <AppButton label="Clear filters" onPress={reset} size="sm" variant="ghost" />
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  );

  const status = listingsQuery.isLoading ? (
    <LoadingState count={3} label="Loading rooms…" variant="skeleton" />
  ) : listingsQuery.isError ? (
    <ErrorState
      body={errorMessage(listingsQuery.error)}
      onRetry={() => listingsQuery.refetch()}
      retryLabel="Retry"
      title="Could not load rooms"
    />
  ) : results.length === 0 ? (
    cityRooms.length === 0 && !isAllCities(city) ? (
      <EmptyState
        actionLabel="Show all cities"
        body={`No one has listed a room in ${city.name} yet. Look in every city, or post the first room here.`}
        iconName="bed"
        onAction={() => setCity(ALL_USA_LOCATION)}
        title={`No rooms in ${city.name} yet`}
      />
    ) : isFiltered ? (
      <EmptyState
        actionLabel="Clear filters"
        body="No rooms match these filters. Clear them or change your search."
        iconName="search"
        onAction={reset}
        title="No matching rooms"
      />
    ) : (
      <EmptyState
        actionLabel="Post a room"
        body="No rooms are listed yet. Be the first to post one."
        iconName="bed"
        onAction={() => go('/rooms/create-listing')}
        title="No rooms yet"
      />
    )
  ) : null;

  const sheets = (
    <>
      <RoomFilterSheet
        onClose={closeFilters}
        resultCount={loaded ? results.length : null}
        visible={filtersOpen}
      />
      <CityPickerSheet
        onClose={() => setCityOpen(false)}
        totalCount={loaded ? (listingsQuery.data?.length ?? 0) : null}
        visible={cityOpen}
      />
    </>
  );

  if (view === 'map') {
    // Fixed, non-scrolling layout: the map takes the remaining height and sits outside any ScrollView, so drawing an
    // area is never taken over by scrolling or pull-to-refresh.
    const mapGutter = windowClass === 'compact' ? 16 : 24;
    const showMap = !status || (loaded && results.length === 0 && hasArea(filters.area));
    return (
      <YStack
        backgroundColor="$background"
        flex={1}
        paddingBottom={insets.bottom + 16}
        paddingTop={insets.top + 8}
      >
        <YStack
          alignSelf="center"
          flex={1}
          maxWidth={maxContentWidth + mapGutter * 2}
          paddingHorizontal={mapGutter}
          width="100%"
        >
          {header}
          {showMap ? (
            <RoomsMap
              area={filters.area}
              city={city}
              isSaved={isSaved}
              onAreaChange={(area) => update({ area })}
              onShowList={() => setView('list')}
              onToggleSave={(room) => toggle(room)}
              rooms={results}
            />
          ) : (
            status
          )}
        </YStack>
        {sheets}
      </YStack>
    );
  }

  // List view: a virtualised grid. It is the scroll container itself (a FlatList inside `Screen`'s ScrollView would
  // render all 500 rows), so it applies the same safe area, gutter and content width as `Screen`.
  const gutter = windowClass === 'compact' ? 16 : 24;
  const innerWidth = Math.min(width - gutter * 2, maxContentWidth);
  const itemWidth = (innerWidth - GRID_GAP * (columns - 1)) / columns;

  return (
    <YStack backgroundColor="$background" flex={1} paddingTop={insets.top}>
      <FlatList
        ItemSeparatorComponent={RowGap}
        ListEmptyComponent={status}
        ListHeaderComponent={header}
        columnWrapperStyle={columns > 1 ? { gap: GRID_GAP } : undefined}
        contentContainerStyle={{
          alignSelf: 'center',
          maxWidth: maxContentWidth + gutter * 2,
          paddingBottom: insets.bottom + SCREEN_BOTTOM_GAP,
          paddingHorizontal: gutter,
          paddingTop: 8,
          width: '100%',
        }}
        data={loaded ? results : []}
        initialNumToRender={6}
        keyExtractor={(room) => room.id}
        key={`rooms-grid-${columns}`}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        numColumns={columns}
        refreshControl={
          <RefreshControl
            colors={[palette.primary]}
            onRefresh={refresh}
            refreshing={pulling}
            tintColor={palette.primary}
          />
        }
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }: { item: RoomListing }) => (
          <YStack width={itemWidth}>
            <RoomCard
              onToggleSave={item.isOwner ? undefined : () => toggle(item)}
              room={item}
              saved={isSaved(item)}
            />
          </YStack>
        )}
        windowSize={5}
      />
      {sheets}
    </YStack>
  );
}

function RowGap() {
  return <YStack height={GRID_GAP} />;
}
