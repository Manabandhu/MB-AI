import { formatSalaryRange } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/components/LocationSelectorModal';
import { listJobPostings } from '@/modules/jobs/api';
import { useSavedJobsStore } from '@/modules/jobs/savedJobsStore';
import { listPublicReferrals } from '@/modules/referrals/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

type FilterState = {
  keyword: string;
  location: string;
  selectedTag: string;
  workModel: 'all' | 'remote';
  minSalary: number;
  sortBy: 'newest' | 'salary_high' | 'salary_low';
};

const INITIAL_FILTERS: FilterState = {
  keyword: '',
  location: '',
  selectedTag: 'All',
  workModel: 'all',
  minSalary: 0,
  sortBy: 'newest',
};

const QUICK_TAGS = [
  { id: 'All', label: 'All jobs' },
  { id: 'remote', label: 'Remote' },
  { id: 'h1b', label: 'H-1B' },
  { id: 'opt', label: 'STEM OPT' },
  { id: 'staff', label: 'Staff & lead' },
  { id: 'austin', label: 'Austin' },
];

export function JobsHomeScreen({ screenId }: { screenId?: string }) {
  const router = useRouter();
  const { session } = useAuthStore();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const params = useLocalSearchParams<{
    keyword?: string;
    location?: string;
    workModel?: string;
  }>();
  useEffect(() => {
    if (
      params.keyword === undefined &&
      params.location === undefined &&
      params.workModel === undefined
    )
      return;
    setFilters((previous) => ({
      ...previous,
      keyword: typeof params.keyword === 'string' ? params.keyword : '',
      location: typeof params.location === 'string' ? params.location : '',
      workModel: params.workModel === 'remote' ? 'remote' : 'all',
    }));
  }, [params.keyword, params.location, params.workModel]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const globalLocation = useLocationStore((s) => s.currentLocation);
  const selectedCity = globalLocation.name;
  const savedIds = useSavedJobsStore((state) => state.ids);
  const savedJobs = useMemo(() => new Set(savedIds), [savedIds]);
  const toggleSaveJob = useSavedJobsStore((state) => state.toggle);

  // Fetch live jobs from Supabase via Spring Boot API
  const {
    data: rawJobs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['jobs', 'list'],
    queryFn: () => listJobPostings(0, 50),
    staleTime: 1000 * 60 * 2,
  });

  // Open referral offers come from the referrals module; the count is only shown once loaded.
  const { data: publicReferrals } = useQuery({
    queryKey: ['referrals', 'public'],
    queryFn: listPublicReferrals,
    staleTime: 1000 * 60 * 2,
  });
  const referralOfferCount = publicReferrals?.filter(
    (r) => r.type?.toLowerCase() === 'offer',
  ).length;
  const postedLastDay = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return rawJobs.filter((job) => new Date(job.createdAt).getTime() >= cutoff).length;
  }, [rawJobs]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const filteredJobs = useMemo(() => {
    return rawJobs
      .filter((job) => {
        if (screenId === 'saved' && !savedJobs.has(job.id)) return false;
        if (filters.keyword.trim()) {
          const q = filters.keyword.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = (job.company || '').toLowerCase().includes(q);
          const matchDesc = (job.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchDesc) return false;
        }

        if (filters.location.trim()) {
          const loc = filters.location.toLowerCase();
          if (!(job.location || '').toLowerCase().includes(loc)) return false;
        }

        if (filters.selectedTag === 'h1b') {
          const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();
          if (!text.includes('h-1b') && !text.includes('h1b')) return false;
        } else if (filters.selectedTag === 'opt') {
          const text = `${job.title} ${job.description}`.toLowerCase();
          if (!text.includes('opt') && !text.includes('stem')) return false;
        } else if (filters.selectedTag === 'remote') {
          if (!job.isRemote && !(job.location || '').toLowerCase().includes('remote')) return false;
        } else if (filters.selectedTag === 'staff') {
          const text = job.title.toLowerCase();
          if (!text.includes('staff') && !text.includes('lead') && !text.includes('principal'))
            return false;
        } else if (filters.selectedTag === 'austin') {
          if (!(job.location || '').toLowerCase().includes('austin')) return false;
        }

        if (filters.minSalary > 0) {
          if ((job.salaryMin || 0) < filters.minSalary) return false;
        }

        if (filters.workModel === 'remote' && !job.isRemote) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'salary_high') {
          return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
        }
        if (filters.sortBy === 'salary_low') {
          return (a.salaryMin || 0) - (b.salaryMin || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [rawJobs, filters, screenId, savedJobs]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <Screen onRefresh={onRefresh} refreshing={isRefreshing}>
        <ScreenHeader
          title={screenId === 'saved' ? 'Saved jobs' : 'Jobs'}
          subtitle="Find your next opportunity."
          back={{ fallback: '/explore' }}
          actions={
            <IconButton
              icon="heart"
              label="Jobs saved on this device"
              onPress={() => router.push('/jobs/saved')}
              variant="plain"
            />
          }
          primaryAction={{
            label: 'Post a job',
            icon: 'plus',
            route: session ? '/jobs/post' : '/sign-in',
          }}
        />
        <YStack gap="$x3">
          <TextField
            aria-label="Search jobs or companies"
            leadingIcon="search"
            placeholder="Search jobs or companies"
            value={filters.keyword}
            onChangeText={(keyword) => setFilters((previous) => ({ ...previous, keyword }))}
            trailing={
              filters.keyword ? (
                <IconButton
                  icon="close"
                  label="Clear job search"
                  variant="plain"
                  onPress={() => setFilters((previous) => ({ ...previous, keyword: '' }))}
                />
              ) : undefined
            }
          />
          <XStack alignItems="center" flexWrap="wrap" gap="$x2">
            <Chip label={selectedCity} icon="map-pin" onPress={() => setCityModalVisible(true)} />
            <AppButton
              label="Filters & sort"
              icon="filter"
              size="sm"
              variant="secondary"
              onPress={() => setFilterModalVisible(true)}
            />
          </XStack>
          <FilterChipRow label="Quick job filters" role="radiogroup">
            {QUICK_TAGS.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.label}
                radio
                selected={filters.selectedTag === tag.id}
                onPress={() => setFilters((previous) => ({ ...previous, selectedTag: tag.id }))}
              />
            ))}
          </FilterChipRow>
          {filters.location ? (
            <AppText tone="muted" variant="caption">
              Location filter: {filters.location}
            </AppText>
          ) : null}
          {!isLoading && !isError ? (
            <AppText tone="muted" variant="caption">
              {rawJobs.length} loaded openings · {postedLastDay} posted today
              {referralOfferCount !== undefined
                ? ` · ${referralOfferCount} community referral offers`
                : ''}
            </AppText>
          ) : null}
        </YStack>
        <Section
          title={`Opportunities (${filteredJobs.length})`}
          subtitle="Community listings. Check details with the employer before applying."
        >
          {isLoading ? (
            <LoadingState variant="skeleton" />
          ) : isError ? (
            <ErrorState
              title="Unable to load jobs"
              body="Check your connection and try again."
              onRetry={() => void refetch()}
            />
          ) : rawJobs.length === 0 ? (
            <EmptyState
              iconName="briefcase"
              title="No jobs posted yet"
              body="Share an opening with your community."
              actionLabel="Post a job"
              onAction={() => router.push(session ? '/jobs/post' : '/sign-in')}
            />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              iconName="search"
              title="No matching jobs"
              body="Try another search or clear your filters."
              actionLabel="Clear filters"
              onAction={() => setFilters(INITIAL_FILTERS)}
            />
          ) : (
            <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 2 }}>
              {filteredJobs.map((job) => {
                const saved = savedJobs.has(job.id);
                const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
                return (
                  <Card flexGrow={1} key={job.id} gap="$x4">
                    <XStack alignItems="center" gap="$x3">
                      <Avatar name={job.company || 'Company'} />
                      <YStack flex={1} minWidth={0} gap="$x1">
                        <AppText variant="label">{job.company || 'Company not listed'}</AppText>
                        <AppText tone="muted" variant="caption">
                          {job.location || (job.isRemote ? 'Remote' : 'Location not listed')}
                        </AppText>
                      </YStack>
                      <IconButton
                        icon="heart"
                        label={saved ? 'Remove job from saved' : 'Save job'}
                        variant={saved ? 'tinted' : 'plain'}
                        onPress={() => toggleSaveJob(job.id)}
                      />
                    </XStack>
                    <AppText variant="h3">{job.title}</AppText>
                    <XStack flexWrap="wrap" gap="$x2">
                      <StatusBadge
                        label={salary || 'Salary not listed'}
                        tone={salary ? 'success' : 'neutral'}
                      />
                      {job.employmentType ? (
                        <Chip
                          variant="tag"
                          label={job.employmentType.replaceAll('_', ' ').toLowerCase()}
                        />
                      ) : null}
                      {job.isRemote ? <StatusBadge label="Remote" tone="info" /> : null}
                    </XStack>
                    <AppButton
                      label="View opportunity"
                      iconAfter="arrow-right"
                      variant="secondary"
                      route={`/jobs/${job.id}`}
                      fullWidth
                    />
                  </Card>
                );
              })}
            </ResponsiveGrid>
          )}
        </Section>
      </Screen>
      <BottomSheet
        visible={filterModalVisible}
        title="Filter & sort jobs"
        onClose={() => setFilterModalVisible(false)}
        scrollable
      >
        <YStack gap="$x5">
          <TextField
            label="City or location"
            placeholder="Any location"
            value={filters.location}
            onChangeText={(location) => setFilters((previous) => ({ ...previous, location }))}
            leadingIcon="map-pin"
          />
          <YStack gap="$x2">
            <AppText variant="label">Work arrangement</AppText>
            <SegmentedControl
              label="Work arrangement"
              value={filters.workModel}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'remote', label: 'Remote' },
              ]}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  workModel: value === 'remote' ? 'remote' : 'all',
                }))
              }
            />
          </YStack>
          <YStack gap="$x2">
            <AppText variant="label">Minimum salary</AppText>
            <XStack flexWrap="wrap" gap="$x2" role="radiogroup" aria-label="Minimum salary">
              {[
                { value: 0, label: 'Any' },
                { value: 150000, label: '$150k+' },
                { value: 180000, label: '$180k+' },
                { value: 200000, label: '$200k+' },
              ].map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  radio
                  selected={filters.minSalary === option.value}
                  onPress={() =>
                    setFilters((previous) => ({ ...previous, minSalary: option.value }))
                  }
                />
              ))}
            </XStack>
          </YStack>
          <YStack gap="$x2">
            <AppText variant="label">Sort by</AppText>
            <YStack gap="$x2" role="radiogroup" aria-label="Sort jobs">
              {[
                { value: 'newest', label: 'Newest first' },
                { value: 'salary_high', label: 'Highest salary' },
                { value: 'salary_low', label: 'Lowest salary' },
              ].map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  radio
                  selected={filters.sortBy === option.value}
                  onPress={() =>
                    setFilters((previous) => ({
                      ...previous,
                      sortBy: option.value as FilterState['sortBy'],
                    }))
                  }
                />
              ))}
            </YStack>
          </YStack>
          <AppButton
            label={`Show ${filteredJobs.length} jobs`}
            onPress={() => setFilterModalVisible(false)}
            fullWidth
          />
          <AppButton
            label="Clear filters"
            variant="ghost"
            onPress={() => setFilters(INITIAL_FILTERS)}
          />
        </YStack>
      </BottomSheet>
      <LocationSelectorModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </YStack>
  );
}

export { JobsHomeScreen as JobsScreen };
