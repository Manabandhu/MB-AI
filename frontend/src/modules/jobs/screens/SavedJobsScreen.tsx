import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type SavedJob = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type SavedJobsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  jobs: SavedJob[];
};

export function SavedJobsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'saved'],
    queryFn: async (): Promise<SavedJobsContent> => {
      const response = await apiFetch('/api/v1/jobs/saved');
      if (!response.ok) throw new Error(`Saved jobs failed: ${response.status}`);
      return response.json() as Promise<SavedJobsContent>;
    },
  });

  const fallback: SavedJobsContent = {
    eyebrow: 'Jobs',
    title: 'Saved jobs',
    subtitle: 'Your bookmarked job opportunities.',
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

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading saved jobs...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load saved jobs"
          body="There was a problem loading saved jobs."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.jobs.length === 0 ? (
        <EmptyState
          title="No saved jobs"
          body="Save jobs to review them later."
          actionLabel="Search jobs"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.jobs.map((job) => (
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
