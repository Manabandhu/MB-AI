import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { ALL_USA_LOCATION } from '@/lib/locationStore';
import type { RoomListing } from '@/modules/rooms/types';
import {
  type CityFilter,
  hasArea,
  isAllCities,
  roomCoordinate,
} from '@/modules/rooms/utils/roomFilters';
import { formatRent } from '@/modules/rooms/utils/roomFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { UniversalMapView } from '@/modules/shared/ui/map/UniversalMapView';
import { showMessage } from '@/modules/shared/ui/notify';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { RoomCard } from './RoomCard';

const MIN_MAP_HEIGHT = 200;
const CITY_DELTA = 0.14;
const COUNTRY_DELTA = 40;

type MapStyle = 'standard' | 'satellite' | 'hybrid';
const MAP_STYLES: { id: MapStyle; label: string }[] = [
  { id: 'standard', label: 'Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
];

/**
 * Rooms on a map (modeled on the rides map): a fixed, card-radius map with approximate pins, draw-an-area search, map
 * style and 3D controls, and the selected room as a card below (beside the map on wide windows). Rooms without real
 * coordinates are counted but never pinned.
 */
export function RoomsMap({
  rooms,
  city,
  area,
  onAreaChange,
  onShowList,
  isSaved,
  onToggleSave,
}: {
  rooms: RoomListing[];
  city: CityFilter;
  area: Coordinate[] | null;
  onAreaChange: (area: Coordinate[] | null) => void;
  onShowList: () => void;
  isSaved: (room: RoomListing) => boolean;
  onToggleSave: (room: RoomListing) => void;
}) {
  const { isDualPane } = useAdaptiveLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [is3D, setIs3D] = useState(false);
  const [center, setCenter] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);

  const markers = useMemo(
    () =>
      rooms.flatMap((room) => {
        const point = roomCoordinate(room);
        if (!point) return [];
        return [
          {
            id: room.id,
            ...point,
            title: room.title,
            // The map adds the currency sign itself.
            price: Math.round(room.price),
            subtitle: [room.roomType, room.broadLocation].filter(Boolean).join(' · '),
            isSelected: room.id === selectedId,
          },
        ];
      }),
    [rooms, selectedId],
  );
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  // A filter change can remove the selected room.
  useEffect(() => {
    if (selectedId && !rooms.some((r) => r.id === selectedId)) setSelectedId(null);
  }, [rooms, selectedId]);

  const nationwide = isAllCities(city);
  const latitude = nationwide ? (markers[0]?.latitude ?? city.latitude) : city.latitude;
  const longitude = nationwide ? (markers[0]?.longitude ?? city.longitude) : city.longitude;
  const delta = nationwide && !markers.length ? COUNTRY_DELTA : CITY_DELTA;
  const unmapped = rooms.length - markers.length;

  const centerOnMe = () => {
    const fallback = () => {
      if (city.latitude != null && city.longitude != null) {
        setCenter({ latitude: city.latitude, longitude: city.longitude, timestamp: Date.now() });
      }
    };
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showMessage('Location unavailable', `Showing ${city.name} instead.`);
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCenter({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: Date.now(),
        }),
      (error) => {
        showMessage(
          'Could not find your location',
          `${error?.message || 'Location is unavailable.'} Showing ${city.name} instead.`,
        );
        fallback();
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const preview = selected ? (
    <Card gap="$x2" variant="elevated">
      <XStack alignItems="flex-start" gap="$x2">
        <YStack flex={1} gap={2} minWidth={0}>
          <AppText tone="primary" variant="bodyStrong">
            {formatRent(selected.price)}
          </AppText>
          <AppText numberOfLines={1} variant="label">
            {selected.title}
          </AppText>
          {selected.broadLocation ? (
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {selected.broadLocation}
            </AppText>
          ) : null}
        </YStack>
        <IconButton
          icon="close"
          label="Close room preview"
          onPress={() => setSelectedId(null)}
          variant="plain"
        />
      </XStack>
      <AppButton
        iconAfter="arrow-right"
        label="View room"
        onPress={() => router.push(`/rooms/${selected.id}` as Href)}
        size="sm"
      />
    </Card>
  ) : null;

  const hint =
    markers.length > 0
      ? 'Tap a pin to preview the room.'
      : rooms.length > 0
        ? `None of these ${rooms.length} rooms has a map position yet.`
        : 'No rooms match here yet. Draw a different area or clear it.';

  // The map fills the space it is given and is never inside a ScrollView, so drawing an area is not taken over by
  // scrolling or pull-to-refresh.
  const map = (
    <YStack
      backgroundColor="$surfaceContainerLow"
      borderRadius="$card"
      flex={isDualPane ? 3 : 1}
      minHeight={MIN_MAP_HEIGHT}
      overflow="hidden"
      position="relative"
    >
      <UniversalMapView
        centerCoordinate={center}
        drawnPolygon={area}
        enableDrawing
        initialRegion={{
          latitude: latitude ?? ALL_USA_LOCATION.latitude,
          longitude: longitude ?? ALL_USA_LOCATION.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        is3D={is3D}
        mapType={mapStyle}
        markers={markers}
        onClearPolygon={() => onAreaChange(null)}
        onPolygonComplete={(polygon) => onAreaChange(polygon)}
        onSelectMarker={setSelectedId}
        selectedMarkerId={selectedId}
        showsUserLocation
        style={StyleSheet.absoluteFill}
      />
      {!isDualPane && preview ? (
        <YStack bottom={12} left={12} position="absolute" right={12}>
          {preview}
        </YStack>
      ) : null}
    </YStack>
  );

  return (
    <YStack flex={1} gap="$x2">
      <XStack alignItems="center" gap="$x2">
        <YStack flex={1} minWidth={0}>
          <FilterChipRow label="Map style" role="radiogroup">
            {MAP_STYLES.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                onPress={() => setMapStyle(option.id)}
                radio
                selected={mapStyle === option.id}
              />
            ))}
            {Platform.OS === 'web' ? null : (
              <Chip
                accessibilityLabel="3D perspective"
                label="3D"
                onPress={() => setIs3D((v) => !v)}
                selected={is3D}
              />
            )}
          </FilterChipRow>
        </YStack>
        <IconButton icon="compass" label="Center the map on my location" onPress={centerOnMe} />
      </XStack>

      <AppText aria-live="polite" numberOfLines={2} tone="muted" variant="caption">
        Approximate areas: {markers.length} of {rooms.length} pinned
        {unmapped > 0 ? ` (${unmapped} without a location are in the list)` : ''}. Draw to search an
        area. {selected ? '' : hint}
      </AppText>

      {isDualPane ? (
        <XStack flex={1} gap="$x4">
          {map}
          <YStack flex={2} gap="$x2" minWidth={0}>
            {selected ? (
              <>
                <XStack alignItems="center" justifyContent="space-between">
                  <AppText variant="label">Selected room</AppText>
                  <IconButton
                    icon="close"
                    label="Close room preview"
                    onPress={() => setSelectedId(null)}
                    variant="plain"
                  />
                </XStack>
                <RoomCard
                  onToggleSave={selected.isOwner ? undefined : () => onToggleSave(selected)}
                  room={selected}
                  saved={isSaved(selected)}
                />
              </>
            ) : (
              <Card variant="filled">
                <AppText tone="muted" variant="caption">
                  {hint}
                </AppText>
              </Card>
            )}
          </YStack>
        </XStack>
      ) : (
        map
      )}

      {hasArea(area) ? (
        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            icon="list"
            label={`Show ${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} in this area`}
            onPress={onShowList}
            size="sm"
          />
          <AppButton
            icon="close"
            label="Clear area"
            onPress={() => onAreaChange(null)}
            size="sm"
            variant="ghost"
          />
        </XStack>
      ) : unmapped > 0 ? (
        <XStack>
          <AppButton
            icon="list"
            label="Show the list"
            onPress={onShowList}
            size="sm"
            variant="secondary"
          />
        </XStack>
      ) : null}
    </YStack>
  );
}
