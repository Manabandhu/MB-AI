import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { ALL_USA_LOCATION, type AppLocation, useLocationStore } from '@/lib/locationStore';
import { searchAllUSCities } from '@/modules/rooms/utils/locationService';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';

/** Shortest query that searches every US city (shorter text keeps the nearby list). */
const MIN_SEARCH_LENGTH = 3;
/** Cap on city matches so the list stays fast on low-end phones. */
const MAX_SEARCH_RESULTS = 40;

type LocationSelectorModalProps = { visible: boolean; onClose: () => void };

type Row =
  | { kind: 'heading'; key: string; label: string }
  | { kind: 'city'; key: string; location: AppLocation; detail: string; icon: AppIconName }
  | { kind: 'detect'; key: string };

function CityRow({
  title,
  detail,
  icon,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  icon: AppIconName;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppearance();
  return (
    <XStack
      alignItems="center"
      aria-label={title}
      aria-selected={selected}
      backgroundColor={selected ? '$primaryTint' : 'transparent'}
      borderRadius="$control"
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      gap="$x3"
      minHeight={52}
      onPress={onPress}
      {...keyboardPress(onPress)}
      paddingHorizontal="$x3"
      pressStyle={{ backgroundColor: '$surfaceContainerLow' }}
      role="button"
    >
      <AppIcon color={selected ? palette.primary : palette.muted} name={icon} size={18} />
      <YStack flex={1}>
        <AppText color={selected ? '$primary' : '$color'} numberOfLines={1} variant="bodyStrong">
          {title}
        </AppText>
        <AppText numberOfLines={1} tone="muted" variant="caption">
          {detail}
        </AppText>
      </YStack>
      {selected ? <AppIcon color={palette.primary} name="check" size={18} /> : null}
    </XStack>
  );
}

/** City picker used by Home and every module that filters by location. */
export function LocationSelectorModal({ visible, onClose }: LocationSelectorModalProps) {
  const t = useT();
  const [query, setQuery] = useState('');
  const current = useLocationStore((s) => s.currentLocation);
  const detected = useLocationStore((s) => s.detectedLocation);
  const nearby = useLocationStore((s) => s.nearbyCities);
  const isDetecting = useLocationStore((s) => s.isDetecting);
  const detect = useLocationStore((s) => s.detectDeviceLocation);
  const setLocation = useLocationStore((s) => s.setLocation);

  const trimmed = query.trim();
  const searching = trimmed.length >= MIN_SEARCH_LENGTH;

  const rows = useMemo<Row[]>(() => {
    if (searching) {
      return searchAllUSCities(trimmed, MAX_SEARCH_RESULTS).map((city) => ({
        kind: 'city',
        key: `s-${city.id}`,
        location: city,
        detail: `${city.stateCode}, United States`,
        icon: 'map-pin',
      }));
    }
    const list: Row[] = [{ kind: 'heading', key: 'h-current', label: t('location.current') }];
    list.push(
      detected
        ? {
            kind: 'city',
            key: `d-${detected.id}`,
            location: detected,
            detail: t('location.current'),
            icon: 'compass',
          }
        : { kind: 'detect', key: 'detect' },
    );
    list.push({
      kind: 'city',
      key: 'all-us',
      location: ALL_USA_LOCATION,
      detail: t('location.allUs'),
      icon: 'globe',
    });
    if (nearby.length > 0) {
      list.push({ kind: 'heading', key: 'h-nearby', label: t('location.nearby') });
      for (const city of nearby) {
        list.push({
          kind: 'city',
          key: `n-${city.id}`,
          location: city,
          detail: city.distanceMiles
            ? `${city.distanceMiles} mi`
            : `${city.stateCode}, United States`,
          icon: 'map-pin',
        });
      }
    }
    return list;
  }, [searching, trimmed, detected, nearby, t]);

  const choose = (location: AppLocation) => {
    setLocation(location);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet
      onClose={onClose}
      size="tall"
      subtitle={t('location.subtitle')}
      title={t('location.title')}
      visible={visible}
    >
      <YStack flex={1} gap="$x3">
        <TextField
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder={t('location.search')}
          returnKeyType="search"
          value={query}
        />
        {trimmed.length > 0 && !searching ? (
          <AppText tone="muted" variant="caption">
            {t('location.typeMore')}
          </AppText>
        ) : null}
        <FlatList
          data={rows}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(row) => row.key}
          ListEmptyComponent={
            searching ? (
              <AppText center paddingVertical="$x6" tone="muted">
                {t('location.noResults')}
              </AppText>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === 'heading') {
              return (
                <AppText paddingHorizontal="$x3" paddingTop="$x3" tone="muted" variant="overline">
                  {item.label}
                </AppText>
              );
            }
            if (item.kind === 'detect') {
              return (
                <XStack alignItems="center">
                  <YStack flex={1}>
                    <CityRow
                      detail={isDetecting ? t('location.detecting') : 'GPS'}
                      icon="compass"
                      // Ignore taps while a lookup is running so two GPS requests never race.
                      onPress={() => {
                        if (!isDetecting) void detect();
                      }}
                      selected={false}
                      title={t('location.detect')}
                    />
                  </YStack>
                  {isDetecting ? <ActivityIndicator style={{ marginRight: 12 }} /> : null}
                </XStack>
              );
            }
            return (
              <CityRow
                detail={item.detail}
                icon={item.icon}
                onPress={() => choose(item.location)}
                selected={current.id === item.location.id}
                title={item.location.name}
              />
            );
          }}
          style={{ flex: 1 }}
        />
      </YStack>
    </BottomSheet>
  );
}
