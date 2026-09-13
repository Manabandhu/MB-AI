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

type Faq = {
  id: string;
  title: string;
  body: string;
  route?: string;
};

type FaqContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: Faq[];
};

export function FaqScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'faq', query],
    queryFn: async (): Promise<FaqContent> => {
      const response = await apiFetch(`/api/v1/immigration/faq?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`FAQ failed: ${response.status}`);
      return response.json() as Promise<FaqContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading FAQ...</Text>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load FAQ"
          body="There was a problem loading FAQ."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;
  const filtered = query
    ? content.items.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.body.toLowerCase().includes(query.toLowerCase()),
      )
    : content.items;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search FAQ..." />
      {filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          body="Try a different search term."
          actionLabel="Clear"
          onAction={() => setQuery('')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
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
