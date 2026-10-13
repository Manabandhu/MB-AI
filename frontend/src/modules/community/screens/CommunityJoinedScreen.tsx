import { contentWidth, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listCommunities } from '@/modules/community/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function CommunityJoinedScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['communities', 'joined'],
    queryFn: listCommunities,
  });

  const communities = useMemo(() => (data ?? []).filter((c) => c.isJoined), [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return communities;
    return communities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [communities, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load joined communities"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          <SectionHeader
            title="Joined Communities"
            subtitle="Communities you participate in and follow."
          />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search joined communities"
            accessibilityLabel="Search joined communities"
          />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No joined communities"
              body="Join communities to see them here."
              actionLabel="Discover"
              onAction={() => router.push('/community/discover')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((c) => (
                <View key={c.id} style={styles.item}>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{c.name}</Text>
                    <Text style={styles.itemSubtitle}>{c.description}</Text>
                    <Text style={styles.itemMeta}>{c.memberCount.toLocaleString()} members</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    page: { backgroundColor: palette.background, flexGrow: 1, padding: space.x4 },
    container: { alignSelf: 'center', gap: space.x6, width: '100%' },
    list: { gap: space.x3 },
    item: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.card,
      borderWidth: 1,
      padding: space.x4,
      gap: space.x1,
    },
    itemBody: { gap: space.x1 },
    itemTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
    itemSubtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    itemMeta: { color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: space.x1 },
  });
};
