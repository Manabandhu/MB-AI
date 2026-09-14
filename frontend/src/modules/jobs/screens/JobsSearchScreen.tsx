import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Job = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type JobsSearchContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  jobs: Job[];
};

export function JobsSearchScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const [query, setQuery] = useState(q ?? '');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'search', query],
    queryFn: async (): Promise<JobsSearchContent> => {
      const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
      const response = await apiFetch(`/api/v1/jobs/search${suffix}`);
      return parseJsonOrThrow(response, 'Jobs search');
    },
  });

  const jobsList = data?.jobs;
  const filtered = useMemo(() => {
    if (!jobsList) return [];
    if (!query.trim()) return jobsList;
    return jobsList.filter(
      (j) =>
        j.title.toLowerCase().includes(query.toLowerCase()) ||
        j.body.toLowerCase().includes(query.toLowerCase()),
    );
  }, [jobsList, query]);

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to search jobs"
          body="There was a problem searching jobs."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search jobs..." />
      {filtered.length === 0 ? (
        <EmptyState
          title="No jobs found"
          body="Try adjusting your search or filters."
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <View style={{ gap: 12, marginTop: 16 }}>
          {filtered.map((job) => (
            <AppButton key={job.id} label={job.title} route={job.route} variant="secondary" />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}
