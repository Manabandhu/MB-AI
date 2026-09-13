import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type SavedItem = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type SavedItemsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: SavedItem[];
};

export function SavedItemsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace', 'saved'],
    queryFn: async (): Promise<SavedItemsContent> => {
      const response = await apiFetch('/api/v1/marketplace/saved');
      if (!response.ok) throw new Error(`Saved items failed: ${response.status}`);
      return response.json() as Promise<SavedItemsContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading saved items...</Text>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load saved items"
          body="There was a problem loading saved items."
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
          title="No saved items"
          body="Save listings to access them quickly."
          actionLabel="Browse listings"
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
