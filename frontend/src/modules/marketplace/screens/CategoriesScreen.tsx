import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Category = {
  id: string;
  title: string;
  body: string;
  route?: string;
};

type CategoriesContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  categories: Category[];
};

export function CategoriesScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: async (): Promise<CategoriesContent> => {
      const response = await apiFetch('/api/v1/marketplace/categories');
      if (!response.ok) throw new Error(`Categories failed: ${response.status}`);
      return response.json() as Promise<CategoriesContent>;
    },
  });

  const fallback: CategoriesContent = {
    eyebrow: 'Marketplace',
    title: 'Categories',
    subtitle: 'Browse items by category.',
    categories: [
      {
        id: '1',
        title: 'Electronics',
        body: 'Cameras, phones, laptops, and accessories.',
        route: '/marketplace/search',
      },
      {
        id: '2',
        title: 'Furniture',
        body: 'Tables, chairs, shelves, and decor.',
        route: '/marketplace/search',
      },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load categories"
          body="There was a problem loading categories."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.categories.length === 0 ? (
        <EmptyState
          title="No categories"
          body="Categories will appear here."
          actionLabel="Browse listings"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.categories.map((category) => (
            <AppButton
              key={category.id}
              label={category.title}
              route={category.route}
              variant="secondary"
            />
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
