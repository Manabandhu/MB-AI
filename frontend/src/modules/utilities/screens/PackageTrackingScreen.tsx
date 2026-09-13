import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { getPackages } from '@/modules/utilities/api';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function PackageTrackingScreen() {
  const layout = useAdaptiveLayout();
  const packages = useQuery({ queryKey: ['utilities', 'packages'], queryFn: getPackages });
  const data = packages.data ?? [];
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.body.toLowerCase().includes(term) ||
        item.meta.toLowerCase().includes(term),
    );
  }, [data, search]);

  if (packages.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Utilities" title="Package tracking" />
          <LoadingState variant="skeleton" count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (packages.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Utilities" title="Package tracking" />
          <ErrorState
            title="Unable to load packages"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => packages.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader
            eyebrow="Utilities"
            title="Package tracking"
            subtitle="Track deliveries and pickup windows."
          />
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search packages..." />
          {filtered.length === 0 ? (
            <EmptyState
              title="No packages found"
              body="Try a different search term or add a tracking number."
              actionLabel="Clear search"
              onAction={() => setSearch('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.iconRow}>
                    <AppIcon color={colors.primary} name="package" size={22} />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <View style={styles.timelineRow}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineTexts}>
                      <Text style={styles.cardMeta}>{item.meta}</Text>
                      <Text style={styles.status}>{item.status}</Text>
                    </View>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  list: { gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2, marginTop: space.x1 },
  dot: { height: 10, width: 10, borderRadius: 5 },
  timelineLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 2,
  },
  timelineTexts: { gap: space.x1 },
  cardMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  status: { color: colors.teal, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
