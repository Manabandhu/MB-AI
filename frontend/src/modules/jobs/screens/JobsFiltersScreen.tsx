import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { listJobCategories } from '@/modules/jobs/api';
import { EMPLOYMENT_TYPES } from '@/modules/jobs/types';
import {
  DEFAULT_JOB_FILTERS,
  filtersFromParams,
  filtersToQuery,
  type JobFilters,
} from '@/modules/jobs/utils/jobFilters';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const MIN_SALARIES = [
  { value: 0, label: 'Any' },
  { value: 100000, label: '$100k+' },
  { value: 150000, label: '$150k+' },
  { value: 200000, label: '$200k+' },
];

/** Filter form for the jobs list. "Show jobs" opens `/jobs/search` with the filters in the URL. */
export function JobsFiltersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [filters, setFilters] = useState<JobFilters>(() => filtersFromParams(params));
  const categoriesQuery = useQuery({
    queryKey: ['jobs', 'categories'],
    queryFn: listJobCategories,
  });
  const update = (patch: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const apply = () => {
    const query = filtersToQuery(filters);
    router.replace(`/jobs/search${query ? `?${query}` : ''}` as Href);
  };

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: '/jobs' as Href }} title="Job filters" />
        <Card gap="$x4">
          <TextField
            label="Location"
            leadingIcon="map-pin"
            onChangeText={(location) => update({ location })}
            placeholder="City or state"
            value={filters.location}
          />
          <FilterChipRow label="Work model">
            <Chip
              label="Remote OK only"
              onPress={() => update({ remoteOnly: !filters.remoteOnly })}
              selected={filters.remoteOnly}
            />
          </FilterChipRow>
          <YStack gap="$x1">
            <AppText variant="label">Type</AppText>
            <FilterChipRow label="Employment type" role="radiogroup">
              <Chip
                label="Any"
                onPress={() => update({ employmentType: null })}
                radio
                selected={!filters.employmentType}
              />
              {EMPLOYMENT_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onPress={() => update({ employmentType: type })}
                  radio
                  selected={filters.employmentType === type}
                />
              ))}
            </FilterChipRow>
          </YStack>
          {(categoriesQuery.data ?? []).length > 0 ? (
            <YStack gap="$x1">
              <AppText variant="label">Category</AppText>
              <FilterChipRow label="Category" role="radiogroup">
                <Chip
                  label="Any"
                  onPress={() => update({ categoryId: null })}
                  radio
                  selected={!filters.categoryId}
                />
                {(categoriesQuery.data ?? []).map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onPress={() => update({ categoryId: category.id })}
                    radio
                    selected={filters.categoryId === category.id}
                  />
                ))}
              </FilterChipRow>
            </YStack>
          ) : categoriesQuery.isError ? (
            <AppText tone="muted" variant="caption">
              Categories could not load; the other filters still work.
            </AppText>
          ) : null}
          <YStack gap="$x1">
            <AppText variant="label">Minimum salary</AppText>
            <FilterChipRow label="Minimum salary" role="radiogroup">
              {MIN_SALARIES.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onPress={() => update({ minSalary: option.value })}
                  radio
                  selected={filters.minSalary === option.value}
                />
              ))}
            </FilterChipRow>
            <AppText tone="muted" variant="caption">
              Jobs without a listed salary are hidden when a minimum is set.
            </AppText>
          </YStack>
        </Card>
        <XStack gap="$x3" justifyContent="flex-end">
          <AppButton
            label="Reset"
            onPress={() => setFilters({ ...DEFAULT_JOB_FILTERS, keyword: filters.keyword })}
            variant="ghost"
          />
          <AppButton label="Show jobs" onPress={apply} />
        </XStack>
      </YStack>
    </Screen>
  );
}
