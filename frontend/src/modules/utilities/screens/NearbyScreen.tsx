import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';
import { getNearby } from '@/modules/utilities/api';
import {
  formatDistance,
  mapsSearchUrl,
  matchesSearch,
  telLink,
} from '@/modules/utilities/utils/utilitiesFormat';

const open = async (url: string, what: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    showError(`Could not open ${what}`, error);
  }
};

/** Places from the community directory, searchable and filterable by category, with call and directions links. */
export function NearbyScreen() {
  const nearby = useQuery({ queryKey: ['utilities', 'nearby'], queryFn: getNearby });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const data = nearby.data ?? [];

  const categories = useMemo(
    () => [...new Set(data.map((p) => p.category).filter(Boolean))].sort(),
    [data],
  );
  const filtered = useMemo(
    () =>
      data.filter(
        (p) =>
          (!category || p.category.toLowerCase() === category.toLowerCase()) &&
          matchesSearch(search, [p.name, p.category, p.address]),
      ),
    [data, search, category],
  );

  const body = () => {
    if (nearby.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (nearby.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => nearby.refetch()}
          retryLabel="Retry"
          title="Unable to load nearby places"
        />
      );
    }
    if (data.length === 0) {
      return (
        <EmptyState
          body="No places have been added to the directory yet."
          iconName="map"
          title="No places listed"
        />
      );
    }
    return (
      <YStack gap="$x3">
        <TextField
          aria-label="Search nearby places"
          leadingIcon="search"
          onChangeText={setSearch}
          placeholder="Search by name, type, or address"
          trailing={
            search ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => setSearch('')}
                variant="plain"
              />
            ) : undefined
          }
          value={search}
        />
        {categories.length > 1 ? (
          <FilterChipRow label="Category" role="radiogroup">
            <Chip label="All" onPress={() => setCategory(null)} radio selected={!category} />
            {categories.map((c) => (
              <Chip
                key={c}
                label={c}
                onPress={() => setCategory(c)}
                radio
                selected={category === c}
              />
            ))}
          </FilterChipRow>
        ) : null}
        {filtered.length === 0 ? (
          <EmptyState
            actionLabel="Clear filters"
            body="No places match that search."
            compact
            onAction={() => {
              setSearch('');
              setCategory(null);
            }}
            title="No matches"
          />
        ) : (
          filtered.map((place) => {
            const distance = formatDistance(place.distanceKm);
            const tel = telLink(place.phone);
            return (
              <Card key={place.id}>
                <XStack alignItems="flex-start" gap="$x2">
                  <YStack flex={1} gap={2}>
                    <AppText variant="bodyStrong">{place.name}</AppText>
                    <AppText tone="muted" variant="caption">
                      {[
                        place.category,
                        distance,
                        place.rating ? `${place.rating.toFixed(1)}★` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </AppText>
                  </YStack>
                </XStack>
                <AppText tone="muted" variant="body">
                  {place.address}
                </AppText>
                <XStack flexWrap="wrap" gap="$x2">
                  <AppButton
                    icon="map-pin"
                    label="Directions"
                    onPress={() => void open(mapsSearchUrl(place.address || place.name), 'maps')}
                    size="sm"
                    variant="secondary"
                  />
                  {tel ? (
                    <AppButton
                      icon="phone"
                      label="Call"
                      onPress={() => void open(tel, 'the phone app')}
                      size="sm"
                      variant="ghost"
                    />
                  ) : null}
                </XStack>
              </Card>
            );
          })
        )}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => nearby.refetch()} refreshing={nearby.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/utilities' as Href }}
        subtitle="Services listed in the community directory."
        title="Nearby"
      />
      {body()}
    </Screen>
  );
}
