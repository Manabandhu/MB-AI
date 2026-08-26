import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type SavedResource = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type SavedResourcesContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: SavedResource[];
};

export function SavedResourcesScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'saved'],
    queryFn: async (): Promise<SavedResourcesContent> => {
      const response = await apiFetch('/api/v1/immigration/saved');
      if (!response.ok) throw new Error(`Saved failed: ${response.status}`);
      return response.json() as Promise<SavedResourcesContent>;
    },
  });

  const fallback: SavedResourcesContent = {
    eyebrow: 'Immigration',
    title: 'Saved resources',
    subtitle: 'Your bookmarked immigration resources.',
    items: [
      {
        id: '1',
        title: 'OPT timeline',
        body: 'Step-by-step OPT application timeline.',
        meta: 'Saved',
        route: '/immigration/resources/1',
      },
      {
        id: '2',
        title: 'Visa categories',
        body: 'Overview of visa categories.',
        meta: 'Saved',
        route: '/immigration/resources/2',
      },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading saved...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load saved resources"
          body="There was a problem loading saved resources."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.items.length === 0 ? (
        <EmptyState
          title="No saved resources"
          body="Save resources to access them quickly."
          actionLabel="Browse resources"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.items.map((item) => (
            <AppButton key={item.id} label={item.title} route={item.route} variant="secondary" />
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
