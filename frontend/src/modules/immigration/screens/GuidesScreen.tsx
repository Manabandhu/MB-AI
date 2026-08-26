import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Guide = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type GuidesContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  guides: Guide[];
};

export function GuidesScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'guides'],
    queryFn: async (): Promise<GuidesContent> => {
      const response = await apiFetch('/api/v1/immigration/guides');
      if (!response.ok) throw new Error(`Guides failed: ${response.status}`);
      return response.json() as Promise<GuidesContent>;
    },
  });

  const fallback: GuidesContent = {
    eyebrow: 'Immigration',
    title: 'Guides',
    subtitle: 'Step-by-step immigration guides.',
    guides: [
      {
        id: '1',
        title: 'F1 to OPT',
        body: 'Timeline and required documents.',
        route: '/immigration/resources/1',
      },
      {
        id: '2',
        title: 'Green card renewal',
        body: 'How to renew your permanent resident card.',
        route: '/immigration/resources/2',
      },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading guides...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load guides"
          body="There was a problem loading guides."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.guides.length === 0 ? (
        <EmptyState
          title="No guides yet"
          body="Guides are being prepared."
          actionLabel="Browse resources"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.guides.map((guide) => (
            <AppButton key={guide.id} label={guide.title} route={guide.route} variant="secondary" />
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
