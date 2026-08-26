import { color as colors, contentWidth, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listCommunities } from '@/modules/community/api';
import { communityScreenFallbacks } from '@/modules/community/communityFallbacks';
import {
  type CatalogCard,
  CatalogScreen,
  type MetricCardData,
} from '@/modules/shared/components/CatalogScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function CommunityHomeScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['communities', 'home'],
    queryFn: listCommunities,
  });

  const fallback = communityScreenFallbacks.home;
  const communities = data ?? fallback.communities ?? [];
  const filtered = useMemo(() => {
    if (!query.trim()) return communities;
    return communities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [communities, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load communities"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const cards: CatalogCard[] = filtered.map((c) => ({
    id: c.id,
    title: c.name,
    body: c.description,
    meta: `${c.memberCount.toLocaleString()} members`,
    route: `/community/${c.id}`,
  }));

  const metrics: MetricCardData[] = fallback.metrics ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          <SectionHeader title={fallback.title} subtitle={fallback.subtitle} />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search communities"
            accessibilityLabel="Search communities"
          />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No communities found"
              body="Try adjusting your search or browse all communities."
              actionLabel="Discover"
              onAction={() => router.push('/community/discover')}
            />
          ) : (
            <CatalogScreen
              eyebrow={fallback.eyebrow}
              title={fallback.title}
              subtitle={fallback.subtitle}
              metrics={metrics}
              cards={cards}
            />
          )}
          <View style={styles.actions}>
            <AppButton label="Discover" route="/community/discover" />
            <AppButton label="Joined" route="/community/joined" variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
});
