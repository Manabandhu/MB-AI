import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { getRoomAmenities } from '@/modules/rooms/api';
import { useRoomFilters } from '@/modules/rooms/hooks/useRoomFilters';
import {
  DIET_FILTERS,
  GENDER_FILTERS,
  hasArea,
  PRICE_STEPS,
  SORT_OPTIONS,
  toggleAmenity,
} from '@/modules/rooms/utils/roomFilters';
import { formatAmount } from '@/modules/rooms/utils/roomFormat';
import { errorMessage, ROOM_TYPES } from '@/modules/rooms/utils/roomLabels';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Chip } from '@/modules/shared/ui/Chip';

/**
 * Every room filter and the sort order in one scrollable sheet. Choices apply immediately to the shared filter state
 * (the same one the quick chips and the map's drawn area use); "Show n rooms" just closes the sheet.
 */
export function RoomFilterSheet({
  visible,
  onClose,
  resultCount,
}: {
  visible: boolean;
  onClose: () => void;
  /** Rooms matching the current filters, or null while loading. */
  resultCount: number | null;
}) {
  const { filters, update, reset, isFiltered } = useRoomFilters();
  const amenitiesQuery = useQuery({
    queryKey: ['rooms', 'amenities'],
    queryFn: getRoomAmenities,
    staleTime: 10 * 60_000,
    enabled: visible,
  });
  const catalog = (amenitiesQuery.data ?? []).filter((a) => a.active !== false);

  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      size="tall"
      subtitle="Changes apply as you choose them."
      title="Filters and sort"
      visible={visible}
    >
      <YStack gap="$x5" paddingBottom="$x2">
        <ChoiceGroup label="Sort by" radio>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              onPress={() => update({ sort: option.id })}
              radio
              selected={filters.sort === option.id}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup label="Max rent per month" radio>
          <Chip
            label="Any rent"
            onPress={() => update({ maxPrice: null })}
            radio
            selected={filters.maxPrice == null}
          />
          {PRICE_STEPS.map((step) => (
            <Chip
              key={step}
              label={`Under ${formatAmount(step)}`}
              onPress={() => update({ maxPrice: step })}
              radio
              selected={filters.maxPrice === step}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup label="Room type" radio>
          <Chip
            label="Any type"
            onPress={() => update({ roomType: null })}
            radio
            selected={!filters.roomType}
          />
          {ROOM_TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              onPress={() => update({ roomType: type })}
              radio
              selected={filters.roomType === type}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup label="Kitchen and diet" radio>
          <Chip
            label="Any diet"
            onPress={() => update({ diet: null })}
            radio
            selected={!filters.diet}
          />
          {DIET_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              onPress={() => update({ diet: option.id })}
              radio
              selected={filters.diet === option.id}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup label="Roommates" radio>
          <Chip
            label="Any gender"
            onPress={() => update({ gender: null })}
            radio
            selected={!filters.gender}
          />
          {GENDER_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              onPress={() => update({ gender: option.id })}
              radio
              selected={filters.gender === option.id}
            />
          ))}
        </ChoiceGroup>

        <ChoiceGroup label="Bathroom">
          <Chip
            icon="check"
            label="Private bath only"
            onPress={() => update({ privateBath: !filters.privateBath })}
            selected={filters.privateBath}
          />
        </ChoiceGroup>

        <YStack gap="$x2">
          <AppText variant="label">Amenities</AppText>
          {amenitiesQuery.isError ? (
            <ErrorState
              body={errorMessage(amenitiesQuery.error)}
              compact
              onRetry={() => amenitiesQuery.refetch()}
              retryLabel="Retry"
              title="Could not load amenities"
            />
          ) : amenitiesQuery.isLoading ? (
            <AppText tone="muted" variant="caption">
              Loading amenities…
            </AppText>
          ) : catalog.length === 0 ? (
            <AppText tone="muted" variant="caption">
              No amenities are set up yet.
            </AppText>
          ) : (
            <XStack aria-label="Amenities" flexWrap="wrap" gap="$x2" role="group">
              {catalog.map((amenity) => (
                <Chip
                  key={amenity.code}
                  label={amenity.label}
                  onPress={() =>
                    update({ amenities: toggleAmenity(filters.amenities, amenity.code) })
                  }
                  selected={filters.amenities.includes(amenity.code.toLowerCase())}
                />
              ))}
            </XStack>
          )}
        </YStack>

        {hasArea(filters.area) ? (
          <ChoiceGroup label="Map area">
            <Chip
              icon="close"
              label="Clear drawn area"
              onPress={() => update({ area: null })}
              selected
            />
          </ChoiceGroup>
        ) : null}

        <XStack flexWrap="wrap" gap="$x2" justifyContent="flex-end">
          <AppButton disabled={!isFiltered} label="Clear all" onPress={reset} variant="ghost" />
          <AppButton
            label={
              resultCount == null
                ? 'Show rooms'
                : `Show ${resultCount} ${resultCount === 1 ? 'room' : 'rooms'}`
            }
            onPress={onClose}
          />
        </XStack>
      </YStack>
    </BottomSheet>
  );
}

function ChoiceGroup({
  label,
  radio,
  children,
}: {
  label: string;
  radio?: boolean;
  children: ReactNode;
}) {
  return (
    <YStack gap="$x2">
      <AppText variant="label">{label}</AppText>
      <XStack aria-label={label} flexWrap="wrap" gap="$x2" role={radio ? 'radiogroup' : 'group'}>
        {children}
      </XStack>
    </YStack>
  );
}
