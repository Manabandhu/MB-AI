import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type JobDetailContent = {
  title: string;
  body: string;
  eyebrow: string;
  meta?: string;
};

type JobDetailsScreenProps = {
  jobId: string;
};

export function JobDetailsScreen({ jobId }: JobDetailsScreenProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: async (): Promise<JobDetailContent> => {
      const response = await apiFetch(`/api/v1/jobs/${jobId}`);
      if (!response.ok) throw new Error(`Job failed: ${response.status}`);
      return response.json() as Promise<JobDetailContent>;
    },
  });

  const fallback: JobDetailContent = {
    eyebrow: 'Jobs',
    title: 'Software Engineer',
    body: 'Join our team to build scalable solutions. Remote-first culture with competitive compensation and growth opportunities.',
    meta: 'Remote · Full-time · $120k',
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load job"
          body="There was a problem loading this job."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.meta} />
      <Text style={styles.body}>{content.body}</Text>
      <View style={styles.actions}>
        <AppButton label="Apply now" route="/jobs/post" />
        <AppButton label="Save job" route="/jobs/saved" variant="secondary" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: color.ink,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space.x4,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x6 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});
