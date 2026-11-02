import { useMemo, useState } from 'react';
import { useTheme, XStack, YStack } from 'tamagui';
import { ALL_USA_LOCATION, type AppLocation, useLocationStore } from '@/lib/locationStore';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { showMessage } from '@/modules/shared/ui/notify';
import { TextField } from '@/modules/shared/ui/TextField';
import { searchAllUSCities } from '@/modules/shared/utils/location/locationService';

const MAX_RESULTS = 35;
const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

/**
 * City switcher: search every US city offline, use the device's location, pick a nearby city, or show all cities.
 * Writes the app-wide `locationStore`, so Home and the other modules follow the same city.
 */
export function CityPickerSheet({
  visible,
  onClose,
  totalCount,
}: {
  visible: boolean;
  onClose: () => void;
  /** Every loaded listing, shown beside "All cities". Null while loading. */
  totalCount: number | null;
}) {
  const current = useLocationStore((s) => s.currentLocation);
  const setLocation = useLocationStore((s) => s.setLocation);
  const detected = useLocationStore((s) => s.detectedLocation);
  const nearby = useLocationStore((s) => s.nearbyCities);
  const isDetecting = useLocationStore((s) => s.isDetecting);
  const detect = useLocationStore((s) => s.detectDeviceLocation);
  const [search, setSearch] = useState('');

  const results = useMemo(
    () => (search.trim() ? searchAllUSCities(search, MAX_RESULTS) : []),
    [search],
  );

  const choose = (city: AppLocation) => {
    setLocation(city);
    setSearch('');
    onClose();
  };

  const locateDevice = async () => {
    const found = await detect();
    if (found) {
      setSearch('');
      onClose();
    } else {
      showMessage(
        'Could not find your location',
        'Location access is off or unavailable. Search for your city instead.',
      );
    }
  };

  return (
    <BottomSheet
      onClose={() => {
        setSearch('');
        onClose();
      }}
      scrollable
      size="tall"
      title="Choose a city"
      visible={visible}
    >
      <YStack gap="$x3" paddingBottom="$x2">
        <TextField
          aria-label="Search US cities"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Search US cities, e.g. Frisco, TX"
          returnKeyType="search"
          value={search}
        />
        {search.trim() ? null : (
          <CityRow
            icon="compass"
            label={detected ? `Near me: ${detected.name}` : 'Use my location'}
            onPress={detected && current.id !== detected.id ? () => choose(detected) : locateDevice}
            role="button"
            selected={Boolean(detected && current.id === detected.id)}
            subtitle={
              isDetecting
                ? 'Finding your location…'
                : detected
                  ? 'From your device or network location'
                  : 'Find the nearest US city'
            }
          />
        )}
        <YStack aria-label="Cities" gap="$x1" role="radiogroup">
          {search.trim() ? (
            results.length === 0 ? (
              <AppText aria-live="polite" tone="muted">
                No US city matches “{search.trim()}”. Check the spelling or try a nearby city.
              </AppText>
            ) : (
              results.map((city) => (
                <CityRow
                  icon="map-pin"
                  key={city.id}
                  label={city.name}
                  onPress={() => choose(city)}
                  selected={current.id === city.id}
                  subtitle={`United States · ${city.stateCode}`}
                />
              ))
            )
          ) : (
            <>
              {nearby.map((city) => (
                <CityRow
                  icon="map-pin"
                  key={city.id}
                  label={city.name}
                  onPress={() => choose(city)}
                  selected={current.id === city.id}
                  subtitle={`${city.distanceMiles} mi away`}
                />
              ))}
              <CityRow
                icon="globe"
                label="All cities (USA)"
                onPress={() => choose(ALL_USA_LOCATION)}
                selected={current.id === ALL_USA_LOCATION.id}
                subtitle={
                  totalCount == null
                    ? 'Listings in every state'
                    : `${totalCount} ${totalCount === 1 ? 'listing' : 'listings'} in every state`
                }
              />
            </>
          )}
        </YStack>
      </YStack>
    </BottomSheet>
  );
}

function CityRow({
  icon,
  label,
  subtitle,
  selected,
  onPress,
  role = 'radio',
}: {
  icon: AppIconName;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'button';
}) {
  const theme = useTheme();
  return (
    <XStack
      alignItems="center"
      aria-checked={role === 'radio' ? selected : undefined}
      aria-label={`${label}, ${subtitle}`}
      backgroundColor={selected ? '$primaryTint' : 'transparent'}
      borderRadius="$control"
      cursor="pointer"
      focusVisibleStyle={focusRing}
      focusable
      gap="$x3"
      hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
      minHeight="$touch"
      onPress={onPress}
      paddingHorizontal="$x3"
      paddingVertical="$x2"
      pressStyle={{ backgroundColor: '$surfaceContainer' }}
      role={role}
    >
      <AppIcon
        color={selected ? theme.primary?.val : theme.colorMuted?.val}
        name={icon}
        size={20}
      />
      <YStack flex={1} gap={2}>
        <AppText tone={selected ? 'primary' : 'default'} variant="bodyStrong">
          {label}
        </AppText>
        <AppText tone="muted" variant="caption">
          {subtitle}
        </AppText>
      </YStack>
      {selected ? <AppIcon color={theme.primary?.val} name="check" size={20} /> : null}
    </XStack>
  );
}
