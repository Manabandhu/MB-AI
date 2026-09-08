import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type JobDetailContent = {
  title: string;
  body: string;
  eyebrow: string;
  meta?: string;
};

export function JobDetailsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: async (): Promise<JobDetailContent> => {
      const response = await apiFetch(`/api/v1/jobs/${jobId}`);
      return parseJsonOrThrow(response, 'Job detail');
    },
    enabled: Boolean(jobId),
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
        <LoadingState />
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
        <AppButton label="Apply now" onPress={() => router.push('/jobs/post')} />
        <AppButton label="Back to search" onPress={() => router.back()} variant="secondary" />
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
});
