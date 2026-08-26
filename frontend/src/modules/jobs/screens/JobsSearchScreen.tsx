import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
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
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'search', query],
    queryFn: async (): Promise<JobsSearchContent> => {
      const response = await apiFetch(`/api/v1/jobs/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Jobs search failed: ${response.status}`);
      return response.json() as Promise<JobsSearchContent>;
    },
  });

  const fallback: JobsSearchContent = {
    eyebrow: 'Jobs',
    title: 'Search jobs',
    subtitle: 'Find job opportunities matching your skills.',
    jobs: [
      {
        id: '1',
        title: 'Software Engineer',
        body: 'Remote · Full-time',
        meta: '$120k',
        route: '/jobs/1',
      },
      { id: '2', title: 'Data Analyst', body: 'Hybrid · Contract', meta: '$85k', route: '/jobs/2' },
    ],
  };

  const content = data ?? fallback;
  const filtered = query
    ? content.jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(query.toLowerCase()) ||
          j.body.toLowerCase().includes(query.toLowerCase()),
      )
    : content.jobs;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Searching jobs...</Text>
      </ScreenShell>
    );
  }

  if (error) {
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
        <View style={styles.list}>
          {filtered.map((job) => (
            <AppButton key={job.id} label={job.title} route={job.route} variant="secondary" />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});
