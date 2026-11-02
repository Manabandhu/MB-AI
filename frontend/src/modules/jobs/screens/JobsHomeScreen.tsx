import { useInfiniteQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { listJobPostingsPage } from '@/modules/jobs/api';
import { JobCard } from '@/modules/jobs/components/JobCard';
import {
  activeFilterCount,
  DEFAULT_JOB_FILTERS,
  filterJobs,
  filtersFromParams,
  filtersToQuery,
  type JobFilters,
  type JobSort,
} from '@/modules/jobs/utils/jobFilters';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Chip } from '@/modules/shared/ui/Chip';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';

const PAGE_SIZE = 50;

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'salary', label: 'Highest salary' },
] as const;

/**
 * `/jobs` and `/jobs/search`: open community job postings with search and real filters (all applied to posting
 * fields). `/jobs/search` reads its filters from the URL, which `/jobs/filters` writes.
 */
export function JobsHomeScreen({ screenId = 'home' }: { screenId?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const [filters, setFilters] = useState<JobFilters>(() =>
    screenId === 'search' ? filtersFromParams(params) : DEFAULT_JOB_FILTERS,
  );

  // `/jobs/filters` replaces this screen's params; follow them.
  const paramKey = screenId === 'search' ? filtersToQuery(filtersFromParams(params)) : '';
  // biome-ignore lint/correctness/useExhaustiveDependencies: paramKey is the serialized params
  useEffect(() => {
    if (screenId === 'search') setFilters(filtersFromParams(params));
  }, [paramKey, screenId]);

  const jobsQuery = useInfiniteQuery({
    queryKey: ['jobs', 'feed'],
    queryFn: ({ pageParam }) => listJobPostingsPage(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    staleTime: 1000 * 60 * 2,
  });
  const loaded = useMemo(
    () => jobsQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [jobsQuery.data],
  );
  // The server's count of open postings; filters below apply to the ones loaded so far.
  const total = jobsQuery.data?.pages[0]?.totalElements ?? 0;
  const jobs = useMemo(() => filterJobs(loaded, filters), [loaded, filters]);
  const openCount = useMemo(() => filterJobs(loaded, DEFAULT_JOB_FILTERS).length, [loaded]);
  const narrowing = activeFilterCount(filters);
  const update = (patch: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const body = () => {
    if (jobsQuery.isLoading) {
      return <LoadingState count={4} label="Loading jobs…" variant="skeleton" />;
    }
    if (jobsQuery.isError && !jobsQuery.data) {
      return (
        <ErrorState
          body={errorText(jobsQuery.error)}
          onRetry={() => jobsQuery.refetch()}
          retryLabel="Retry"
          title="Could not load jobs"
        />
      );
    }
    if (openCount === 0) {
      return (
        <EmptyState
          actionLabel="Post a job"
          body="Be the first to share an opening with the community."
          iconName="briefcase"
          onAction={() => router.push((signedIn ? '/jobs/post' : '/sign-in') as Href)}
          title="No open jobs yet"
        />
      );
    }
    if (jobs.length === 0) {
      return (
        <EmptyState
          actionLabel="Clear filters"
          body="Try a different search or fewer filters."
          onAction={() => setFilters(DEFAULT_JOB_FILTERS)}
          title="No jobs match"
        />
      );
    }
    return (
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }} gap={12}>
        {jobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => jobsQuery.refetch()} refreshing={jobsQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: (screenId === 'search' ? '/jobs' : '/home') as Href }}
          primaryAction={{
            label: 'Post a job',
            icon: 'plus',
            onPress: () => router.push((signedIn ? '/jobs/post' : '/sign-in') as Href),
          }}
          subtitle={jobsQuery.data ? `${total} open ${total === 1 ? 'role' : 'roles'}` : undefined}
          title="Jobs"
        />
        <TextField
          accessibilityLabel="Search jobs"
          leadingIcon="search"
          onChangeText={(keyword) => update({ keyword })}
          placeholder="Title, company, or skill"
          returnKeyType="search"
          value={filters.keyword}
        />
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          <FilterChipRow label="Quick filters">
            <Chip
              label="Remote OK"
              onPress={() => update({ remoteOnly: !filters.remoteOnly })}
              selected={filters.remoteOnly}
            />
            <Chip
              count={narrowing || undefined}
              icon="filter"
              label="Filters"
              onPress={() => router.push(`/jobs/filters?${filtersToQuery(filters)}` as Href)}
              selected={narrowing > 0}
            />
          </FilterChipRow>
          {narrowing > 0 ? (
            <AppButton
              label="Clear"
              onPress={() => setFilters({ ...DEFAULT_JOB_FILTERS, keyword: filters.keyword })}
              size="sm"
              variant="ghost"
            />
          ) : null}
        </XStack>
        <SegmentedControl
          label="Sort jobs"
          onChange={(sort: JobSort) => update({ sort })}
          options={SORTS}
          value={filters.sort}
        />
        {jobsQuery.data && openCount > 0 ? (
          <AppText tone="muted" variant="caption">
            {jobs.length === openCount
              ? `Showing ${openCount === total ? 'all' : `the latest ${openCount} of`} ${total}`
              : `${jobs.length} match among the latest ${openCount} of ${total}`}
          </AppText>
        ) : null}
        {body()}
        {jobsQuery.hasNextPage ? (
          <AppButton
            disabled={jobsQuery.isFetchingNextPage}
            label="Load more jobs"
            loading={jobsQuery.isFetchingNextPage}
            onPress={() => jobsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
        {jobsQuery.isFetchNextPageError ? (
          <AppText role="alert" tone="danger" variant="caption">
            {errorText(jobsQuery.error, 'More jobs could not load.')}
          </AppText>
        ) : null}
        <AppButton
          icon="handshake"
          label="Looking for a referral? Browse referrals"
          onPress={() => router.push('/referrals' as Href)}
          variant="ghost"
        />
      </YStack>
    </Screen>
  );
}

export { JobsHomeScreen as JobsScreen };
