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

type Resource = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type ResourcesContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  resources: Resource[];
};

export function ResourcesScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'resources', query],
    queryFn: async (): Promise<ResourcesContent> => {
      const response = await apiFetch(
        `/api/v1/immigration/resources?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error(`Resources failed: ${response.status}`);
      return response.json() as Promise<ResourcesContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load resources"
          body="There was a problem loading resources."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;
  const filtered = query
    ? content.resources.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.body.toLowerCase().includes(query.toLowerCase()),
      )
    : content.resources;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search resources..." />
      {filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          body="Try adjusting your search."
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((resource) => (
            <AppButton
              key={resource.id}
              label={resource.title}
              route={resource.route}
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
