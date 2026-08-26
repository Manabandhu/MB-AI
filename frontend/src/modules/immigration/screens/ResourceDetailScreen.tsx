import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type ResourceDetailContent = {
  title: string;
  body: string;
  eyebrow: string;
  meta?: string;
};

type ResourceDetailScreenProps = {
  resourceId: string;
};

export function ResourceDetailScreen({ resourceId }: ResourceDetailScreenProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'resource', resourceId],
    queryFn: async (): Promise<ResourceDetailContent> => {
      const response = await apiFetch(`/api/v1/immigration/resources/${resourceId}`);
      if (!response.ok) throw new Error(`Resource failed: ${response.status}`);
      return response.json() as Promise<ResourceDetailContent>;
    },
  });

  const fallback: ResourceDetailContent = {
    eyebrow: 'Immigration',
    title: 'Resource details',
    body: 'Detailed immigration guidance and reference material.',
    meta: 'Last updated today',
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading resource...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load resource"
          body="There was a problem loading this resource."
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
        <AppButton label="Back to resources" route="/immigration/resources" variant="secondary" />
        <AppButton label="Save resource" route="/immigration/saved" />
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
