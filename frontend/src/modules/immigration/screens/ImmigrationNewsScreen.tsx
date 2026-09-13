import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type NewsItem = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type NewsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: NewsItem[];
};

export function ImmigrationNewsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'news'],
    queryFn: async (): Promise<NewsContent> => {
      const response = await apiFetch('/api/v1/immigration/news');
      if (!response.ok) throw new Error(`News failed: ${response.status}`);
      return response.json() as Promise<NewsContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading news...</Text>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load news"
          body="There was a problem loading news."
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
      {content.items.length === 0 ? (
        <EmptyState
          title="No news"
          body="Check back later for immigration news."
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
